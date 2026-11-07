import { AdminUser, useAdmin, useAdminCall } from "@/admin/api";
import {
  A,
  AButton,
  AConfirm,
  AField,
  ALoading,
  ARow,
  AScreen,
  ASection,
  ASheet,
  AText,
  ATiles,
  ConfirmRequest,
  languageLabel,
  when,
} from "@/admin/ui";
import { LANGS, LANGUAGE_NAMES } from "@/i18n";
import useAuth from "@/providers/AuthProvider";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

type Sheet = "edit" | "points" | "move" | null;

const SOURCE = { points: "with points", gift: "gift", purchase: "bought" } as const;

const UserScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();
  const { data: user, isValidating, mutate } = useAdmin<AdminUser>(`/users/${id}`);
  const { call, busy } = useAdminCall();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const [form, setForm] = useState({ username: "", email: "", language: "" as string | null, points: "", reason: "", joinCode: "", prizeId: "" });

  if (!user) return <ALoading />;

  const isMe = me?.id === user.id;
  const lastMember = user.household.members === 1;
  const close = () => setSheet(null);
  const open = (next: Sheet) => {
    setForm({ username: user.username, email: user.email, language: user.language, points: "", reason: "", joinCode: "", prizeId: "" });
    setSheet(next);
  };
  const run = async (method: "post" | "put" | "delete", path: string, body?: unknown, success?: string) => {
    const result = await call(method, `/users/${user.id}${path}`, body, success);
    if (result) close();
    return result;
  };


  return (
    <AScreen
      back
      backLabel="Users"
      title={user.username}
      subtitle={`${user.email}${user.type === "admin" ? " · admin" : ""}`}
      refreshing={isValidating}
      onRefresh={() => mutate()}
      dock={<AButton flex={1} label="Edit profile" onPress={() => open("edit")} />}
    >
      <ATiles
        tiles={[
          { value: user.stats.answers.toLocaleString(), label: "Answers" },
          { value: user.stats.trips.toLocaleString(), label: "Trips" },
          { value: user.stats.points.toLocaleString(), label: "Points" },
        ]}
      />
      <ASection title="Profile">
        <ARow first label="Language" value={languageLabel(user.language, user.deviceLanguage)} />
        <ARow label="Joined" value={when(user.createdAt)} />
        <ARow label="Last active" value={when(user.lastActive)} />
      </ASection>

      <ASection title="Household" note="A user belongs to exactly one household. Moving them takes them out of this one.">
        <ARow
          first
          label={user.household.name || `Household ${user.household.id}`}
          value={`${user.household.members} ${user.household.members === 1 ? "member" : "members"}`}
          href={`/admin/households/${user.household.id}`}
        />
        <ARow
          label={`Foods of ${user.household.name || `Household ${user.household.id}`}`}
          href={`/admin/foods?householdId=${user.household.id}&householdName=${encodeURIComponent(user.household.name || `Household ${user.household.id}`)}`}
        />
        <ARow label="Move to another household" tone="action" onPress={() => open("move")} />
      </ASection>

      <ASection title="Skins" note="Wear switches their skin right away. Unlocked skins are a gift: their points stay as they are.">
        {user.skins.map((skin, index) => {
          const wearing = user.skin === skin.skin;
          const unlock = user.unlocks.find((entry) => entry.prizeId === skin.prizeId);
          return (
            <ARow
              key={skin.prizeId}
              first={index === 0}
              label={skin.name}
              sub={wearing ? "Wearing" : skin.owned ? (unlock ? `Unlocked · ${SOURCE[unlock.source]}` : "Free") : `Locked · ${skin.price} points`}
              right={
                <View style={styles.rowActions}>
                  {unlock && (
                    <AButton
                      variant="text"
                      label="Take back"
                      onPress={() =>
                        setConfirm({
                          title: `Take ${skin.name} back?`,
                          line: `${user.username} loses ${skin.name}${wearing ? " and goes back to Arcade" : ""}. Their points don't change.`,
                          action: "Take it back",
                          onConfirm: () => run("delete", `/unlocks/${skin.prizeId}`, undefined, `${skin.name} taken back`),
                        })
                      }
                    />
                  )}
                  {!wearing && skin.owned && (
                    <AButton variant="secondary" label="Wear" onPress={() => run("put", "/skin", { skin: skin.skin }, `${user.username} now wears ${skin.name}`)} />
                  )}
                  {!skin.owned && (
                    <AButton
                      label="Unlock"
                      onPress={() =>
                        setConfirm({
                          title: `Unlock ${skin.name} for ${user.username}?`,
                          line: "Free for them, their points stay as they are. Logged as a gift.",
                          tone: "primary",
                          action: "Unlock and wear",
                          onConfirm: () => run("post", "/unlocks", { prizeId: skin.prizeId, wear: true }, `${skin.name} unlocked and worn`),
                          secondary: {
                            label: "Unlock only",
                            onConfirm: () => run("post", "/unlocks", { prizeId: skin.prizeId }, `${skin.name} unlocked`),
                          },
                        })
                      }
                    />
                  )}
                </View>
              }
            />
          );
        })}
      </ASection>

      <ASection title="Points">
        <ARow first label="Balance" value={user.stats.points.toLocaleString()} />
        <ARow label="Give or remove points" tone="action" onPress={() => open("points")} />
      </ASection>

      <ASection title="Access">
        <ARow
          first
          label={user.type === "admin" ? "Remove admin role" : "Make admin"}
          tone={isMe ? "disabled" : "action"}
          value={isMe ? "Not on yourself" : ""}
          onPress={() =>
            setConfirm({
              title: user.type === "admin" ? `Remove ${user.username}'s admin role?` : `Make ${user.username} admin?`,
              line: user.type === "admin" ? "They lose the admin tab right away." : "They get this admin tab and can change any account.",
              action: user.type === "admin" ? "Remove admin role" : "Make admin",
              onConfirm: () => run("put", "/admin", { admin: user.type !== "admin" }, "Role updated"),
            })
          }
        />
        <ARow
          label="Log out everywhere"
          tone="action"
          value={`${user.stats.sessions} ${user.stats.sessions === 1 ? "session" : "sessions"}`}
          onPress={() =>
            setConfirm({
              title: `Log ${user.username} out everywhere?`,
              line: "Every phone they use asks them to log in again.",
              action: "Log out everywhere",
              onConfirm: () => run("post", "/logout", undefined, "Logged out everywhere"),
            })
          }
        />
        <ARow
          label="Delete user"
          tone={isMe || user.type === "admin" ? "disabled" : "danger"}
          value={isMe ? "Not on yourself" : user.type === "admin" ? "Remove admin role first" : ""}
          onPress={() =>
            setConfirm({
              title: `Delete ${user.username}?`,
              line: lastMember
                ? `This can't be undone. ${user.username} is the last member of their household, so these go too:`
                : "This can't be undone. Their household stays with its other members.",
              losses: [
                ...(lastMember
                  ? [
                      `The household "${user.household.name || `Household ${user.household.id}`}"`,
                      `${user.household.foods} foods and their history`,
                      `${user.household.lists} lists and ${user.household.trips} shopping trips`,
                    ]
                  : []),
                `${user.stats.points} points and ${user.unlocks.length} unlocked skins`,
              ],
              action: `Delete ${user.username}`,
              typeToConfirm: "DELETE",
              onConfirm: async () => {
                if (await call("delete", `/users/${user.id}`, undefined, `${user.username} deleted`)) router.back();
              },
            })
          }
        />
      </ASection>

      {user.actions.length > 0 && (
        <ASection title="Admin changes">
          {user.actions.map((action, index) => (
            <ARow key={action.id} first={index === 0} label={action.summary} sub={`${action.admin ?? "Someone"} · ${when(action.at)}`} />
          ))}
        </ASection>
      )}

      <ASheet visible={sheet === "edit"} title="Edit profile" onClose={close}>
        <AField label="Name" value={form.username} onChange={(username) => setForm({ ...form, username })} />
        <AField label="Email" value={form.email} keyboardType="email-address" onChange={(email) => setForm({ ...form, email })} />
        <AText size={14} color={A.mid}>Language</AText>
        <View style={styles.choices}>
          {[null, ...LANGS].map((language) => (
            <AButton
              key={language ?? "auto"}
              variant={form.language === language ? "primary" : "secondary"}
              label={language ? LANGUAGE_NAMES[language] : languageLabel(null, user.deviceLanguage)}
              onPress={() => setForm({ ...form, language })}
            />
          ))}
        </View>
        <AButton label="Save" busy={busy} onPress={() => run("put", "", { username: form.username, email: form.email, language: form.language }, "Profile saved")} />
      </ASheet>

      <ASheet visible={sheet === "points"} title="Give or remove points" line="Use a minus sign to remove points. The balance can't go below zero." onClose={close}>
        <AField label="Points (e.g. 100 or -50)" value={form.points} keyboardType="numbers-and-punctuation" onChange={(points) => setForm({ ...form, points })} />
        <AField label="Reason (optional)" value={form.reason} onChange={(reason) => setForm({ ...form, reason })} />
        <AButton
          label="Apply"
          busy={busy}
          disabled={!Number.isInteger(Number(form.points)) || Number(form.points) === 0}
          onPress={() => run("post", "/points", { amount: Number(form.points), reason: form.reason }, "Points updated")}
        />
      </ASheet>

      <ASheet visible={sheet === "move"} title={`Move ${user.username}`} line="Enter the join code of the household to move them to, or leave it empty to give them a new household of their own." onClose={close}>
        <AField label="Join code" value={form.joinCode} onChange={(joinCode) => setForm({ ...form, joinCode })} />
        <AButton
          label={form.joinCode.trim() ? "Move" : "Move to a new household"}
          busy={busy}
          onPress={() => run("put", "/household", form.joinCode.trim() ? { joinCode: form.joinCode.trim() } : {}, "Moved")}
        />
      </ASheet>

      <AConfirm request={confirm} onClose={() => setConfirm(null)} />
    </AScreen>
  );
};

const styles = StyleSheet.create({
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  rowActions: { alignItems: "center", flexDirection: "row", gap: 6 },
});

export default UserScreen;
