import Press from "@/components/elements/Press";
import common from "@/i18n/common";
import T from "../text";
import EditBadge from "@/components/views/Account/_components/EditBadge";
import GuestCard from "@/components/views/Account/_components/GuestCard";
import AccountPanels from "@/components/views/Account/_components/AccountPanels";
import useAccount from "@/hooks/screens/useAccount";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { calmColors, useCalmColors } from "./colors";
import { CText, Screen } from "./parts";

const Group = ({ label, children }: { label: string; children: ReactNode }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  return (
    <View>
      <CText size={skin.type.label} color={C.textSoft} style={styles.groupLabel}>{label}</CText>
      {children}
    </View>
  );
};

const Row = ({
  label,
  detail,
  onPress,
  color,
  chevron = true,
}: {
  label: string;
  detail?: string;
  onPress: () => void;
  color?: string;
  chevron?: boolean;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.tint }]}
    >
      <CText size={skin.type.body} color={color ?? C.text}>{label}</CText>
      <CText size={skin.type.label} color={C.textSoft} numberOfLines={1} style={styles.detail}>
        {`${detail ?? ""}${chevron ? (detail ? " ›" : "›") : ""}`}
      </CText>
    </Press>
  );
};

const CalmAccount = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.account;
  const account = useAccount();
  const { user, setOpenPanel } = account;

  if (!user) return null;

  const others = account.members.filter((member) => member.id !== user.id);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Screen padded={false}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <CText weight="medium" size={skin.type.headline} accessibilityRole="header">{T.settings.title}</CText>

          <Group label={T.settings.account}>
            {account.isGuest ? (
              <Press
                accessibilityRole="button"
                accessibilityLabel={`${user.username}, ${common.guestRename.action}`}
                onPress={account.openGuestName}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.tint }]}
              >
                <CText size={skin.type.body} numberOfLines={1} style={styles.name}>{user.username}</CText>
                <EditBadge />
              </Press>
            ) : (
              <View style={styles.row}>
                <CText size={skin.type.body}>{user.username}</CText>
                <CText size={skin.type.label} color={C.textSoft} numberOfLines={1} style={styles.detail}>{user.email}</CText>
              </View>
            )}
          </Group>

          {account.isGuest ? (
            <Group label={copy.household}>
              <View style={styles.guest}>
                <GuestCard account={account} ink={C.text} />
              </View>
            </Group>
          ) : (
            <Group label={copy.household}>
              <View style={styles.row}>
                <CText size={skin.type.body}>{account.householdName || copy.householdFallback}</CText>
                <CText size={skin.type.label} color={C.textSoft} numberOfLines={1} style={styles.detail}>
                  {others.length ? T.settings.with(others.map((member) => member.username)) : T.settings.justYou}
                </CText>
              </View>
              <Row label={T.settings.invite} detail={account.joinCode} onPress={() => setOpenPanel("qr")} />
              <Row label={T.settings.share} onPress={account.shareCode} />
              <Row label={copy.switch} onPress={() => setOpenPanel("switch")} />
            </Group>
          )}

          <Group label={T.settings.app}>
            <Row label={copy.suggested} onPress={account.replayOnboarding} />
            <Row label={copy.refine} onPress={account.refineFoods} />
            <Row label={common.language} detail={account.languageName} onPress={account.openLanguage} />
            <Row label={account.looksLabel} onPress={account.openLooks} />
            {account.hasThemes && <Row label={common.theme} detail={account.themeName} onPress={account.openTheme} />}
            <Row label={common.notifications.menu} onPress={account.openNotifications} />
            {account.needsEmailCode && <Row label={common.emailCode.menu} onPress={account.openEmailCode} />}
            <Row label={copy.credits} onPress={account.openCredits} />
          </Group>

          {!account.isGuest && (
            <Group label={copy.dangerTitle}>
              <Row label={copy.logout} chevron={false} onPress={account.logOut} />
              {!account.isAdmin && (
                <Row label={copy.delete} color={C.danger} chevron={false} onPress={() => setOpenPanel("delete")} />
              )}
            </Group>
          )}
        </ScrollView>
      </Screen>
      <AccountPanels account={account} />
    </KeyboardAvoidingView>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    scroll: { gap: s.spacing.section + 4, paddingBottom: s.spacing.section, paddingHorizontal: s.spacing.gutter },
    groupLabel: { paddingBottom: s.spacing.small },
    row: {
      alignItems: "center",
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      justifyContent: "space-between",
      minHeight: s.size.row.list - 4,
    },
    detail: { flexShrink: 1, textAlign: "right" },
    name: { flexShrink: 1 },
    guest: { borderTopColor: C.line, borderTopWidth: s.shape.divider, paddingTop: s.spacing.inline },
  });

export default CalmAccount;
