import { AdminHousehold, useAdmin, useAdminCall } from "@/admin/api";
import { AButton, AConfirm, AField, ALoading, ARow, AScreen, ASection, ASheet, ConfirmRequest, when } from "@/admin/ui";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";

type Sheet = "add" | "rename" | null;

const HouseholdScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: home, isValidating, mutate } = useAdmin<AdminHousehold>(`/households/${id}`);
  const { call, busy } = useAdminCall();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  if (!home) return <ALoading />;

  const label = home.name || `Household ${home.id}`;
  const open = (next: Sheet) => {
    setValue(next === "rename" ? home.name ?? "" : "");
    setSheet(next);
  };
  const run = async (method: "post" | "put" | "delete", path: string, body?: unknown, success?: string) => {
    const result = await call(method, `/households/${home.id}${path}`, body, success);
    if (result) setSheet(null);
    return result;
  };

  return (
    <AScreen
      back
      backLabel="Households"
      title={label}
      subtitle={`Code ${home.joinCode} · created ${when(home.createdAt)} · active ${when(home.lastActive)}`}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      dock={<AButton flex={1} label="Add a member by email" onPress={() => open("add")} />}
    >
      <ASection title={`Members · ${home.members.length}`} note="A removed member gets a new household of their own.">
        {home.members.length === 0 && <ARow first label="No members" tone="disabled" />}
        {home.members.map((member, index) => (
          <ARow
            key={member.id}
            first={index === 0}
            label={member.type === "admin" ? `${member.username} · admin` : member.username}
            sub={member.email}
            href={`/admin/users/${member.id}`}
            right={
              <AButton
                variant="text"
                label="Remove"
                onPress={() =>
                  setConfirm({
                    title: `Remove ${member.username}?`,
                    line: `${member.username} leaves ${label} and gets a new, empty household of their own.`,
                    action: "Remove",
                    onConfirm: () => run("delete", `/members/${member.id}`, undefined, `${member.username} removed`),
                  })
                }
              />
            }
          />
        ))}
      </ASection>

      <ASection title="Content">
        {home.lists.map((list, index) => (
          <ARow key={list.id} first={index === 0} label={list.isMain ? `${list.title} · main` : list.title} value={`${list.foods} foods`} href={`/admin/lists/${list.id}`} />
        ))}
        <ARow label="Foods" value={`${home.foods} · ${home.needed} needed`} href={`/admin/foods?householdId=${home.id}&householdName=${encodeURIComponent(label)}`} />
        <ARow label="Shopping trips" value={`${home.trips.count} · last ${when(home.trips.last)}`} />
        <ARow label="Races" value={`${home.races.count} · last ${when(home.races.last)}`} />
      </ASection>

      <ASection title="Settings">
        <ARow first label="Rename" tone="action" onPress={() => open("rename")} />
        <ARow
          label="New join code"
          value="Old codes and QR stop working"
          tone="action"
          onPress={() =>
            setConfirm({
              title: "Make a new join code?",
              line: `The code ${home.joinCode} and its QR code stop working right away.`,
              action: "New join code",
              onConfirm: () => run("post", "/join-code", undefined, "New join code ready"),
            })
          }
        />
      </ASection>

      <ASection title="Danger">
        <ARow
          first
          label="Delete household"
          tone={home.members.length ? "disabled" : "danger"}
          value={home.members.length ? "Remove members first" : ""}
          onPress={() =>
            setConfirm({
              title: `Delete ${label}?`,
              line: "This can't be undone. These go too:",
              losses: [`${home.foods} foods and their history`, `${home.lists.length} lists`, `${home.trips.count} shopping trips`],
              action: "Delete household",
              typeToConfirm: "DELETE",
              onConfirm: async () => {
                if (await run("delete", "", undefined, `${label} deleted`)) router.back();
              },
            })
          }
        />
      </ASection>

      {home.actions.length > 0 && (
        <ASection title="Admin changes">
          {home.actions.map((action, index) => (
            <ARow key={action.id} first={index === 0} label={action.summary} sub={`${action.admin ?? "Someone"} · ${when(action.at)}`} />
          ))}
        </ASection>
      )}

      <ASheet visible={sheet === "add"} title={`Add a member to ${label}`} line="They leave their current household and join this one." onClose={() => setSheet(null)}>
        <AField label="Their email" value={value} keyboardType="email-address" onChange={setValue} autoFocus />
        <AButton label="Add member" busy={busy} disabled={!value.trim()} onPress={() => run("post", "/members", { email: value.trim() }, "Member added")} />
      </ASheet>
      <ASheet visible={sheet === "rename"} title="Rename household" onClose={() => setSheet(null)}>
        <AField label="Name" value={value} onChange={setValue} autoFocus />
        <AButton label="Save" busy={busy} disabled={!value.trim()} onPress={() => run("put", "", { name: value.trim() }, "Renamed")} />
      </ASheet>
      <AConfirm request={confirm} onClose={() => setConfirm(null)} />
    </AScreen>
  );
};

export default HouseholdScreen;
