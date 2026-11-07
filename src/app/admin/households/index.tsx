import { AdminHouseholdRow, Paged, query, useAdmin, useAdminCall } from "@/admin/api";
import { A, AButton, AEmpty, AField, ALoading, ARow, AScreen, ASearch, ASection, ASheet, AText, when } from "@/admin/ui";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

const HouseholdsScreen = () => {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const { call, busy } = useAdminCall();
  const { data, isValidating, mutate } = useAdmin<Paged<AdminHouseholdRow>>(`/households${query({ search: search.trim() })}`);

  const create = async () => {
    const created = await call<{ id: number }>("post", "/households", { name }, "Household created");
    if (!created) return;
    setCreating(false);
    setName("");
    router.push(`/admin/households/${created.id}`);
  };

  if (!data) return <ALoading />;

  return (
    <AScreen
      back
      title="Households"
      count={data.total}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      header={<ASearch value={search} onChange={setSearch} placeholder="Name or join code" />}
      dock={<AButton flex={1} label="New household" onPress={() => setCreating(true)} />}
    >
      <ASection>
        {data.items.length === 0 && <AEmpty line="No household matches." />}
        {data.items.map((home, index) => (
          <ARow
            key={home.id}
            first={index === 0}
            label={home.name || `Household ${home.id}`}
            sub={`${home.members} ${home.members === 1 ? "member" : "members"} · ${home.foods} foods · ${home.needed} needed · ${when(home.lastActive)}`}
            value={home.joinCode}
            href={`/admin/households/${home.id}`}
          />
        ))}
      </ASection>
      {data.total > data.items.length && (
        <AText size={13} color={A.soft} style={styles.more}>{`Showing ${data.items.length} of ${data.total}. Search to narrow it down.`}</AText>
      )}
      <ASheet visible={creating} title="New household" line="It starts empty, with its main list. Add members from its page." onClose={() => setCreating(false)}>
        <AField label="Name (optional)" value={name} onChange={setName} />
        <AButton label="Create household" busy={busy} onPress={create} />
      </ASheet>
    </AScreen>
  );
};

const styles = StyleSheet.create({ more: { paddingHorizontal: 20 } });

export default HouseholdsScreen;
