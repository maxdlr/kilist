import { AdminListRow, Paged, query, useAdmin, useAdminCall } from "@/admin/api";
import { A, AButton, AEmpty, AField, ALoading, ARow, AScreen, ASearch, ASection, ASheet, AText } from "@/admin/ui";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

const ListsScreen = () => {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ householdId: "", title: "" });
  const { call, busy } = useAdminCall();
  const { data, isValidating, mutate } = useAdmin<Paged<AdminListRow>>(`/lists${query({ search: search.trim() })}`);

  const create = async () => {
    const created = await call<{ id: number }>("post", "/lists", { householdId: Number(form.householdId), title: form.title }, "List created");
    if (!created) return;
    setCreating(false);
    router.push(`/admin/lists/${created.id}`);
  };

  if (!data) return <ALoading />;

  return (
    <AScreen
      back
      title="Lists"
      count={data.total}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      header={<ASearch value={search} onChange={setSearch} placeholder="List or household name" />}
      dock={<AButton flex={1} label="New list" onPress={() => setCreating(true)} />}
    >
      <ASection>
        {data.items.length === 0 && <AEmpty line="No list matches." />}
        {data.items.map((list, index) => (
          <ARow
            key={list.id}
            first={index === 0}
            label={list.isMain ? `${list.title} · main` : list.title}
            sub={list.household?.name || `Household ${list.household?.id}`}
            value={`${list.foods} foods`}
            href={`/admin/lists/${list.id}`}
          />
        ))}
      </ASection>
      {data.total > data.items.length && (
        <AText size={13} color={A.soft} style={styles.more}>{`Showing ${data.items.length} of ${data.total}. Search to narrow it down.`}</AText>
      )}
      <ASheet visible={creating} title="New list" onClose={() => setCreating(false)}>
        <AField label="Household id" value={form.householdId} keyboardType="number-pad" onChange={(householdId) => setForm({ ...form, householdId })} />
        <AField label="Title" value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <AButton label="Create list" busy={busy} disabled={!form.title.trim() || !Number(form.householdId)} onPress={create} />
      </ASheet>
    </AScreen>
  );
};

const styles = StyleSheet.create({ more: { paddingHorizontal: 20 } });

export default ListsScreen;
