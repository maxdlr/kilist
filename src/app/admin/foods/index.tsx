import { AdminFoodRow, AdminHouseholdRow, AdminUserRow, FoodScope, Paged, query, useAdmin, useAdminCall } from "@/admin/api";
import { A, AButton, AChips, AEmpty, AField, ALoading, ARow, AScreen, ASearch, ASection, ASheet, AText, Dot, LEVEL_NAMES, levelIndex } from "@/admin/ui";
import FoodIcon from "@/components/elements/FoodIcon";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "needed", label: "Needed" },
  { value: "noIcon", label: "No icon" },
  { value: "snoozed", label: "Next time" },
] as const;

type Scope = { kind: "household"; id: number; label: string } | { kind: "user"; id: number; label: string } | null;
type Picker = "household" | "user" | null;

const HouseIcon = ({ color = A.soft }: { color?: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M4 11l8-6 8 6v8H4zM10 19v-5h4v5" />
  </Svg>
);

const ScopePicker = ({ kind, onPick, onClose }: { kind: Picker; onPick: (scope: Scope) => void; onClose: () => void }) => {
  const [search, setSearch] = useState("");
  const households = useAdmin<Paged<AdminHouseholdRow>>(kind === "household" ? `/households${query({ search: search.trim() })}` : null);
  const users = useAdmin<Paged<AdminUserRow>>(kind === "user" ? `/users${query({ search: search.trim() })}` : null);

  return (
    <ASheet visible={!!kind} title={kind === "user" ? "Foods of a user" : "Foods of a household"} line={kind === "user" ? "A user's foods are their household's foods." : undefined} onClose={onClose}>
      <ASearch value={search} onChange={setSearch} placeholder={kind === "user" ? "Name or email" : "Name or join code"} />
      <ScrollView style={styles.picker} keyboardShouldPersistTaps="handled">
        {kind === "household" &&
          (households.data?.items ?? []).map((home, index) => (
            <ARow
              key={home.id}
              first={index === 0}
              label={home.name || `Household ${home.id}`}
              sub={`${home.foods} foods · ${home.members} ${home.members === 1 ? "member" : "members"}`}
              value={home.joinCode}
              onPress={() => onPick({ kind: "household", id: home.id, label: home.name || `Household ${home.id}` })}
            />
          ))}
        {kind === "user" &&
          (users.data?.items ?? []).map((user, index) => (
            <ARow
              key={user.id}
              first={index === 0}
              label={user.username}
              sub={user.email}
              value={user.household?.name || (user.household ? `Household ${user.household.id}` : "")}
              onPress={() => onPick({ kind: "user", id: user.id, label: user.username })}
            />
          ))}
      </ScrollView>
    </ASheet>
  );
};

const FoodsScreen = () => {
  const params = useLocalSearchParams<{ householdId?: string; householdName?: string; userId?: string; userName?: string; noIcon?: string }>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>(params.noIcon ? "noIcon" : "all");
  const [scope, setScope] = useState<Scope>(
    params.userId
      ? { kind: "user", id: Number(params.userId), label: params.userName ?? "User" }
      : params.householdId
        ? { kind: "household", id: Number(params.householdId), label: params.householdName ?? "Household" }
        : null,
  );
  const [picker, setPicker] = useState<Picker>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const { call, busy } = useAdminCall();
  const { data, isValidating, mutate } = useAdmin<Paged<AdminFoodRow> & { scope: FoodScope }>(
    `/foods${query({
      search: search.trim(),
      householdId: scope?.kind === "household" ? scope.id : undefined,
      userId: scope?.kind === "user" ? scope.id : undefined,
      needed: filter === "needed" && "1",
      noIcon: filter === "noIcon" && "1",
      snoozed: filter === "snoozed" && "1",
    })}`,
  );

  const scopeHousehold = data?.scope?.household;
  const householdLabel = scopeHousehold ? scopeHousehold.name || `Household ${scopeHousehold.id}` : "";

  const create = async () => {
    if (!scopeHousehold) return;
    const created = await call<{ id: number }>("post", "/foods", { householdId: scopeHousehold.id, name }, `${name} added to ${householdLabel}`);
    if (!created) return;
    setCreating(false);
    setName("");
    router.push(`/admin/foods/${created.id}`);
  };

  if (!data) return <ALoading />;

  return (
    <AScreen
      back
      title={scope ? "Foods" : "All foods"}
      count={data.total}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      header={
        <View style={styles.header}>
          <ASearch value={search} onChange={setSearch} placeholder="Food name, any spelling" />
          {scope ? (
            <View style={styles.scope}>
              <HouseIcon color="#FFFFFF" />
              <AText size={14} weight="bold" color="#FFFFFF" style={styles.flex} numberOfLines={2}>
                {scope.kind === "user"
                  ? `${data.scope?.user?.username ?? scope.label}'s household · ${householdLabel}`
                  : `Household · ${householdLabel || scope.label}`}
              </AText>
              <Pressable accessibilityRole="button" accessibilityLabel="Show every household" onPress={() => setScope(null)} style={styles.clear}>
                <AText size={14} weight="bold" color="#FFFFFF">Clear</AText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.pickers}>
              <AButton flex={1} variant="secondary" label="By household" onPress={() => setPicker("household")} />
              <AButton flex={1} variant="secondary" label="By user" onPress={() => setPicker("user")} />
            </View>
          )}
          <AChips options={[...FILTERS]} value={filter} onChange={setFilter} />
        </View>
      }
      dock={
        <>
          <AButton
            flex={1}
            variant="secondary"
            label="Match icons"
            busy={busy}
            onPress={() => call<{ checked: number; matched: number }>("post", "/foods/match-icons", undefined, "Icons matched")}
          />
          <AButton
            flex={1}
            label={scopeHousehold ? "New food here" : "New food"}
            onPress={() => (scopeHousehold ? setCreating(true) : setPicker("household"))}
          />
        </>
      }
    >
      <ASection>
        {data.items.length === 0 && <AEmpty line={search ? `No food close to "${search}".` : "No food matches."} />}
        {data.items.map((food, index) => {
          const level = levelIndex(food.inStockScore);
          const home = food.household?.name || `Household ${food.household?.id}`;
          return (
            <ARow
              key={food.id}
              first={index === 0}
              label={food.name}
              sub={scope ? (food.icon ? undefined : "No icon") : `${home}${food.icon ? "" : " · no icon"}`}
              accessibilityLabel={`${food.name} in ${home}, ${LEVEL_NAMES[level]}`}
              href={`/admin/foods/${food.id}`}
              left={
                <View style={styles.icon}>
                  <FoodIcon name={food.icon} size={30} />
                </View>
              }
              right={
                <View style={styles.level}>
                  <Dot color={A.level[level]!} />
                  <AText size={13} color={A.mid}>{LEVEL_NAMES[level]}</AText>
                </View>
              }
            />
          );
        })}
      </ASection>
      {data.total > data.items.length && (
        <AText size={13} color={A.soft} style={styles.more}>{`Showing ${data.items.length} of ${data.total}. Search or filter to narrow it down.`}</AText>
      )}

      <ScopePicker
        kind={picker}
        onClose={() => setPicker(null)}
        onPick={(next) => {
          setScope(next);
          setPicker(null);
        }}
      />
      <ASheet visible={creating} title={`New food in ${householdLabel}`} line="It goes on the household's main list, with its icon matched from the name." onClose={() => setCreating(false)}>
        <AField label="Name" value={name} onChange={setName} autoFocus />
        <AButton label="Add food" busy={busy} disabled={!name.trim()} onPress={create} />
      </ASheet>
    </AScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: 10 },
  pickers: { flexDirection: "row", gap: 8 },
  scope: { alignItems: "center", backgroundColor: A.ink, borderRadius: 10, flexDirection: "row", gap: 8, minHeight: 44, paddingLeft: 12 },
  clear: { justifyContent: "center", minHeight: 44, paddingHorizontal: 14 },
  icon: { alignItems: "center", backgroundColor: A.ground, borderRadius: 8, height: 38, justifyContent: "center", width: 38 },
  level: { alignItems: "center", flexDirection: "row", gap: 6 },
  picker: { borderColor: A.line, borderRadius: 12, borderWidth: 1, maxHeight: 360 },
  more: { paddingHorizontal: 20 },
});

export default FoodsScreen;
