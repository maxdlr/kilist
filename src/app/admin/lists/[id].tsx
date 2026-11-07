import { AdminList, useAdmin, useAdminCall } from "@/admin/api";
import { A, AButton, AConfirm, AField, ALoading, ARow, AScreen, ASearch, ASection, ASheet, ConfirmRequest, when } from "@/admin/ui";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

type Sheet = "add" | "rename" | null;

const ListScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: list, isValidating, mutate } = useAdmin<AdminList>(`/lists/${id}`);
  const { call, busy } = useAdminCall();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  if (!list) return <ALoading />;

  const home = list.household.name || `Household ${list.household.id}`;
  const run = (method: "post" | "put" | "delete", path: string, body?: unknown, success?: string) =>
    call(method, `/lists/${list.id}${path}`, body, success);
  const available = list.available.filter((food) => food.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <AScreen
      back
      backLabel="Lists"
      title={list.isMain ? `${list.title} · main` : list.title}
      subtitle={`${home} · ${list.foods.length} foods`}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      header={
        <View style={styles.actions}>
          <AButton
            variant="secondary"
            label="Rename"
            onPress={() => {
              setTitle(list.title);
              setSheet("rename");
            }}
          />
          <AButton
            variant="secondary"
            label={list.isMain ? "Main list" : "Make main"}
            disabled={list.isMain}
            onPress={() => run("put", "", { isMain: true }, "Now the main list")}
          />
          <AButton
            variant="secondary"
            label="Delete"
            disabled={list.isMain}
            onPress={() =>
              setConfirm({
                title: `Delete ${list.title}?`,
                line: "The list goes; its foods stay in the household.",
                action: "Delete list",
                onConfirm: async () => {
                  if (await run("delete", "", undefined, "List deleted")) router.back();
                },
              })
            }
          />
        </View>
      }
      dock={
        <AButton
          flex={1}
          label="Add foods"
          disabled={!list.available.length}
          onPress={() => {
            setPicked([]);
            setSearch("");
            setSheet("add");
          }}
        />
      }
    >
      <ASection>
        {list.foods.length === 0 && <ARow first label="No foods on this list" tone="disabled" />}
        {list.foods.map((food, index) => (
          <ARow
            key={food.id}
            first={index === 0}
            label={food.name}
            href={`/admin/foods/${food.id}`}
            right={<AButton variant="text" label="Remove" onPress={() => run("delete", `/foods/${food.id}`, undefined, `${food.name} removed`)} />}
          />
        ))}
      </ASection>

      {list.actions.length > 0 && (
        <ASection title="Admin changes">
          {list.actions.map((action, index) => (
            <ARow key={action.id} first={index === 0} label={action.summary} sub={`${action.admin ?? "Someone"} · ${when(action.at)}`} />
          ))}
        </ASection>
      )}

      <ASheet visible={sheet === "add"} title={`Add foods to ${list.title}`} line={`Foods of ${home} that aren't on this list yet.`} onClose={() => setSheet(null)}>
        <ASearch value={search} onChange={setSearch} placeholder="Food name" />
        <ScrollView style={styles.picker}>
          {available.map((food, index) => (
            <ARow
              key={food.id}
              first={index === 0}
              label={food.name}
              value={picked.includes(food.id) ? "Selected" : ""}
              onPress={() => setPicked((all) => (all.includes(food.id) ? all.filter((entry) => entry !== food.id) : [...all, food.id]))}
            />
          ))}
        </ScrollView>
        <AButton
          label={picked.length ? `Add ${picked.length}` : "Pick foods"}
          busy={busy}
          disabled={!picked.length}
          onPress={async () => {
            if (await run("post", "/foods", { foodIds: picked }, "Foods added")) setSheet(null);
          }}
        />
      </ASheet>
      <ASheet visible={sheet === "rename"} title="Rename list" onClose={() => setSheet(null)}>
        <AField label="Title" value={title} onChange={setTitle} autoFocus />
        <AButton
          label="Save"
          busy={busy}
          disabled={!title.trim()}
          onPress={async () => {
            if (await run("put", "", { title: title.trim() }, "Renamed")) setSheet(null);
          }}
        />
      </ASheet>
      <AConfirm request={confirm} onClose={() => setConfirm(null)} />
    </AScreen>
  );
};

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  picker: { borderColor: A.line, borderRadius: 12, borderWidth: 1, maxHeight: 320 },
});

export default ListScreen;
