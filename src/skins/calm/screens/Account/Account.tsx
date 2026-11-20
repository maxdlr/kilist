import { FeedbackSlot } from "@/components/elements/Feedback";
import Press from "@/components/elements/Press";
import common from "@/i18n/common";
import T from "@/skins/calm/text";
import EditBadge from "@/components/features/Account/EditBadge";
import GuestCard from "@/components/features/Account/GuestCard";
import { ButtonKindOverride } from "@/components/elements/KilButton";
import AccountPanels from "@/components/features/Account/AccountPanels";
import useAccount from "@/hooks/screens/useAccount";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import { AvoidKeyboard } from "@/components/elements/BackBar";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText, GlassScrollView, Screen } from "@/skins/calm/components";
import Group from "./_components/Group";
import Row from "./_components/Row";
import GLASS from "./glass";

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
    <AvoidKeyboard>
      <Screen padded={false} glass glassLook={GLASS}>
        <GlassScrollView contentContainerStyle={styles.scroll}>
          <CText weight="medium" size={skin.type.headline} accessibilityRole="header">{T.settings.title}</CText>
          <FeedbackSlot place="account" />

          <Group label={T.settings.account}>
            <Press
              accessibilityRole="button"
              accessibilityLabel={`${user.username}, ${account.isGuest ? common.guestRename.action : common.guestRename.accountAction}`}
              onPress={account.openName}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.tint }]}
            >
              <CText size={skin.type.body} numberOfLines={1} style={styles.name}>{user.username}</CText>
              <EditBadge />
            </Press>
            {!account.isGuest && (
              <View style={styles.row}>
                <CText size={skin.type.label} color={C.textSoft} numberOfLines={1} style={styles.name}>{user.email}</CText>
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
              <Press
                accessibilityRole="button"
                accessibilityLabel={`${account.householdName || copy.householdFallback}, ${common.householdRename.action}`}
                onPress={account.openHouseholdName}
                style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.tint }]}
              >
                <CText size={skin.type.body} numberOfLines={1} style={styles.name}>
                  {account.householdName || copy.householdFallback}
                </CText>
                <EditBadge />
              </Press>
              <View style={styles.row}>
                <CText size={skin.type.label} color={C.textSoft} numberOfLines={1} style={styles.name}>
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
        </GlassScrollView>
      </Screen>
      <ButtonKindOverride.Provider value="secondary">
        <AccountPanels account={account} />
      </ButtonKindOverride.Provider>
    </AvoidKeyboard>
  );
};

export default CalmAccount;

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    scroll: { gap: s.spacing.section + 4, paddingBottom: s.spacing.section, paddingHorizontal: s.spacing.gutter },
    row: {
      alignItems: "center",
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      justifyContent: "space-between",
      minHeight: s.size.row.list - 4,
    },
    name: { flexShrink: 1 },
    guest: { borderTopColor: C.line, borderTopWidth: s.shape.divider, paddingTop: s.spacing.inline },
  });
