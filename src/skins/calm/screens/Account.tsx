import AccountPanels from "@/components/views/Account/_components/AccountPanels";
import useAccount from "@/hooks/screens/useAccount";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { calmPalette as C } from "..";
import { CText, Screen } from "./parts";

const Group = ({ label, children }: { label: string; children: ReactNode }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <View>
      <CText size={skin.type.label} color={C.soft} style={styles.groupLabel}>{label}</CText>
      {children}
    </View>
  );
};

const Row = ({
  label,
  detail,
  onPress,
  color = C.ink,
  chevron = true,
}: {
  label: string;
  detail?: string;
  onPress: () => void;
  color?: string;
  chevron?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.tint }]}
    >
      <CText size={skin.type.body} color={color}>{label}</CText>
      <CText size={skin.type.label} color={C.soft} numberOfLines={1} style={styles.detail}>
        {`${detail ?? ""}${chevron ? (detail ? " ›" : "›") : ""}`}
      </CText>
    </Pressable>
  );
};

const CalmAccount = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.account;
  const account = useAccount();
  const { user, setOpenPanel } = account;

  if (!user) return null;

  const others = account.members.filter((member) => member.id !== user.id);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="height">
      <Screen padded={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <CText weight="medium" size={skin.type.headline} accessibilityRole="header">Settings</CText>

          <Group label="Account">
            <View style={styles.row}>
              <CText size={skin.type.body}>{user.username}</CText>
              <CText size={skin.type.label} color={C.soft} numberOfLines={1} style={styles.detail}>{user.email}</CText>
            </View>
          </Group>

          <Group label={copy.household}>
            <View style={styles.row}>
              <CText size={skin.type.body}>{account.householdName || copy.householdFallback}</CText>
              <CText size={skin.type.label} color={C.soft} numberOfLines={1} style={styles.detail}>
                {others.length ? `with ${others.map((member) => member.username).join(", ")}` : "Just you"}
              </CText>
            </View>
            <Row label="Invite someone" detail={account.joinCode} onPress={() => setOpenPanel("qr")} />
            <Row label="Share the code" onPress={account.shareCode} />
            <Row label={copy.switch} onPress={() => setOpenPanel("switch")} />
          </Group>

          <Group label="App">
            <Row label="Appearance" detail={`${skin.name} · ${account.balance} points`} onPress={() => setOpenPanel("prizes")} />
            <Row label={copy.suggested} onPress={account.suggestFoods} />
            <Row label={copy.credits} onPress={account.openCredits} />
          </Group>

          <View>
            <Row label={copy.logout} chevron={false} onPress={account.logOut} />
            {!account.isAdmin && (
              <Row label={copy.delete} color={C.danger} chevron={false} onPress={() => setOpenPanel("delete")} />
            )}
          </View>
        </ScrollView>
      </Screen>
      <AccountPanels account={account} />
    </KeyboardAvoidingView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    scroll: { gap: s.spacing.section + 4, paddingBottom: s.spacing.section, paddingHorizontal: s.spacing.gutter },
    groupLabel: { paddingBottom: s.spacing.small },
    row: {
      alignItems: "center",
      borderTopColor: C.hairline,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      justifyContent: "space-between",
      minHeight: s.size.row.list - 4,
    },
    detail: { flexShrink: 1, textAlign: "right" },
  });

export default CalmAccount;
