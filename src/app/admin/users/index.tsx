import { AdminUserRow, Paged, query, useAdmin, useAdminCall } from "@/admin/api";
import { A, AButton, AChips, AEmpty, AField, ALoading, ARow, AScreen, ASearch, ASection, ASheet, AText, languageLabel, when } from "@/admin/ui";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "admins", label: "Admins" },
  { value: "fr", label: "French" },
  { value: "en", label: "English" },
  { value: "auto", label: "Phone setting" },
] as const;


const UsersScreen = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", joinCode: "" });
  const { call, busy } = useAdminCall();
  const { data, isValidating, mutate } = useAdmin<Paged<AdminUserRow>>(
    `/users${query({
      search: search.trim(),
      admin: filter === "admins" && "1",
      language: (filter === "fr" || filter === "en" || filter === "auto") && filter,
    })}`,
  );

  const create = async () => {
    const created = await call<{ id: number }>("post", "/users", form, `${form.username} created`);
    if (!created) return;
    setCreating(false);
    setForm({ username: "", email: "", password: "", joinCode: "" });
    router.push(`/admin/users/${created.id}`);
  };

  if (!data) return <ALoading />;

  return (
    <AScreen
      back
      title="Users"
      count={data.total}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      header={
        <View style={styles.header}>
          <ASearch value={search} onChange={setSearch} placeholder="Name or email" />
          <AChips options={[...FILTERS]} value={filter} onChange={setFilter} />
        </View>
      }
      dock={<AButton flex={1} label="New user" onPress={() => setCreating(true)} />}
    >
      <ASection>
        {data.items.length === 0 && <AEmpty line="No user matches." />}
        {data.items.map((user, index) => (
          <ARow
            key={user.id}
            first={index === 0}
            label={user.type === "admin" ? `${user.username} · admin` : user.username}
            sub={user.email}
            value={`${user.skin} · ${languageLabel(user.language, user.deviceLanguage, true)}\n${when(user.lastActive)}`}
            href={`/admin/users/${user.id}`}
            left={
              <View style={styles.avatar}>
                <AText weight="bold" color={A.mid}>{user.username.charAt(0).toUpperCase()}</AText>
              </View>
            }
          />
        ))}
      </ASection>
      {data.total > data.items.length && (
        <AText size={13} color={A.soft} style={styles.more}>{`Showing ${data.items.length} of ${data.total}. Search to narrow it down.`}</AText>
      )}

      <ASheet visible={creating} title="New user" line="They can log in right away with this password." onClose={() => setCreating(false)}>
        <AField label="Name" value={form.username} onChange={(username) => setForm({ ...form, username })} />
        <AField label="Email" value={form.email} keyboardType="email-address" onChange={(email) => setForm({ ...form, email })} />
        <AField label="Temporary password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        <AField label="Join code (empty = new household)" value={form.joinCode} onChange={(joinCode) => setForm({ ...form, joinCode })} />
        <AButton label="Create user" busy={busy} disabled={!form.username || !form.email || !form.password} onPress={create} />
      </ASheet>
    </AScreen>
  );
};

const styles = StyleSheet.create({
  header: { gap: 10 },
  avatar: { alignItems: "center", backgroundColor: A.chip, borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  more: { paddingHorizontal: 20 },
});

export default UsersScreen;
