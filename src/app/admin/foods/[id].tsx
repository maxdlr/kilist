import { AdminFood, useAdmin, useAdminCall } from "@/admin/api";
import { A, AButton, AConfirm, AField, ALoading, ARow, AScreen, ASection, ASheet, AText, ConfirmRequest, LEVEL_NAMES, levelIndex, when } from "@/admin/ui";
import FoodIcon from "@/components/elements/FoodIcon";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

const ANSWER = { have: "have it", need: "need it", unsure: "not sure" } as const;

const FoodScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: food, isValidating, mutate } = useAdmin<AdminFood>(`/foods/${id}`);
  const { call, busy } = useAdminCall();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  if (!food) return <ALoading />;

  const run = (method: "post" | "put" | "delete", path: string, body?: unknown, success?: string) =>
    call(method, `/foods/${food.id}${path}`, body, success);
  const snoozed = food.snoozedUntil && new Date(food.snoozedUntil) > new Date();
  const home = food.household.name || `Household ${food.household.id}`;

  return (
    <AScreen
      back
      backLabel="Foods"
      title={food.name}
      subtitle={`In ${home}`}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      dock={
        <AButton
          flex={1}
          label="Edit name and description"
          onPress={() => {
            setForm({ name: food.name, description: food.description });
            setEditing(true);
          }}
        />
      }
    >
      <View style={styles.hero}>
        <View style={styles.icon}>
          <FoodIcon name={food.icon} size={52} />
        </View>
        <View style={styles.flex}>
          <AText size={13} color={A.soft}>{food.icon ? `Icon: ${food.icon}` : "No icon matched"}</AText>
          <AText size={14} color={A.mid}>{`This is ${home}'s ${food.name}. Each household has its own copy of a food, with its own stock, answers and store order.`}</AText>
        </View>
      </View>

      <ASection title="Household">
        <ARow first label={home} value="Open household" href={`/admin/households/${food.household.id}`} />
        <ARow
          label={`All foods of ${home}`}
          href={`/admin/foods?householdId=${food.household.id}&householdName=${encodeURIComponent(home)}`}
        />
      </ASection>

      <ASection title={`Stock in ${home}`}>
        <ARow first label="Level" value={`${LEVEL_NAMES[levelIndex(food.inStockScore)]} · score ${food.inStockScore}`} />
        <ARow label="Next time until" value={snoozed ? when(food.snoozedUntil) : "Not snoozed"} />
        <ARow
          label="Reset score"
          value="Asked again next game"
          tone="action"
          onPress={() =>
            setConfirm({
              title: `Reset ${food.name}?`,
              line: `Only in ${home}: its answers there are cleared, so it counts as never checked and comes back in their next game.`,
              action: "Reset score",
              onConfirm: () => run("post", "/reset-score", undefined, "Score reset"),
            })
          }
        />
        <ARow label={'Clear "next time"'} tone={snoozed ? "action" : "disabled"} onPress={() => run("post", "/unsnooze", undefined, "Back on the list")} />
      </ASection>

      <ASection title={`Last answers in ${home}`}>
        {food.history.length === 0 && <ARow first label="Never checked" tone="disabled" />}
        {food.history.map((entry, index) => (
          <ARow key={`${entry.at}-${index}`} first={index === 0} label={`${entry.user ?? "Someone"} · ${ANSWER[entry.answer]}`} value={when(entry.at)} />
        ))}
      </ASection>

      <ASection title={`Usually bought next in ${home}`}>
        {food.usuallyNext.length === 0 && <ARow first label="Not learned yet" tone="disabled" />}
        {food.usuallyNext.map((next, index) => (
          <ARow key={next.id} first={index === 0} label={next.name} value={`${next.times} times`} href={`/admin/foods/${next.id}`} />
        ))}
      </ASection>

      <ASection title={`On lists of ${home}`}>
        {food.lists.length === 0 && <ARow first label="On no list" tone="disabled" />}
        {food.lists.map((list, index) => (
          <ARow key={list.id} first={index === 0} label={list.isMain ? `${list.title} · main` : list.title} href={`/admin/lists/${list.id}`} />
        ))}
      </ASection>

      <ASection title="Danger">
        <ARow
          first
          label="Delete food"
          tone="danger"
          onPress={() =>
            setConfirm({
              title: `Delete ${food.name}?`,
              line: `This can't be undone. It leaves every list of ${home}, with its answers and store-order history.`,
              action: "Delete food",
              onConfirm: async () => {
                if (await run("delete", "", undefined, `${food.name} deleted`)) router.back();
              },
            })
          }
        />
      </ASection>

      {food.actions.length > 0 && (
        <ASection title="Admin changes">
          {food.actions.map((action, index) => (
            <ARow key={action.id} first={index === 0} label={action.summary} sub={`${action.admin ?? "Someone"} · ${when(action.at)}`} />
          ))}
        </ASection>
      )}

      <ASheet visible={editing} title="Edit food" line="Renaming matches the icon again." onClose={() => setEditing(false)}>
        <AField label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <AField label="Description" value={form.description} onChange={(description) => setForm({ ...form, description })} />
        <AButton
          label="Save"
          busy={busy}
          disabled={!form.name.trim()}
          onPress={async () => {
            if (await run("put", "", { name: form.name.trim(), description: form.description }, "Food saved")) setEditing(false);
          }}
        />
      </ASheet>
      <AConfirm request={confirm} onClose={() => setConfirm(null)} />
    </AScreen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 4 },
  hero: { alignItems: "center", flexDirection: "row", gap: 14, paddingHorizontal: 16 },
  icon: { alignItems: "center", backgroundColor: A.card, borderColor: A.line, borderRadius: 14, borderWidth: 1, height: 68, justifyContent: "center", width: 68 },
});

export default FoodScreen;
