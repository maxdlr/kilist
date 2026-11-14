import common from "@/i18n/common";
import type { Skin } from "@/skins/types";
import ActionRow from "@/components/elements/ActionRow";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useAccount from "@/hooks/screens/useAccount";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { caseFor } from "@/skins";
import { ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import EditBadge from "./_components/EditBadge";
import GuestCard from "./_components/GuestCard";
import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import AccountPanels from "./_components/AccountPanels";

const RoastAccount = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.account;
  const insets = useSafeAreaInsets();
  const account = useAccount();
  const { user, joinCode, householdName, members, setOpenPanel } = account;

  useStatusBarStyle(skin.statusBarOnGround);

  if (!user) return null;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView
        style={[styles.flex, { backgroundColor: skin.colors.ground }]}
      >
        <View style={[styles.hero, { paddingTop: insets.top + skin.spacing.top }]}>
          {account.isGuest ? (
            <Press
              accessibilityRole="button"
              accessibilityLabel={`${user.username}, ${common.guestRename.action}`}
              onPress={account.openGuestName}
              style={withPressed(styles.nameRow)}
            >
              <View style={styles.flex}>
                <Title size={skin.type.display.sm} lines={2} color={skin.colors.onGround}>
                  {copy.hello(caseFor(skin, user.username))}
                </Title>
              </View>
              <EditBadge />
            </Press>
          ) : (
            <Title size={skin.type.display.sm} lines={2} color={skin.colors.onGround}>
              {copy.hello(caseFor(skin, user.username))}
            </Title>
          )}
          <ThemedText mono size={skin.type.mono} color={skin.colors.onGround}>
            {user.email}
          </ThemedText>
        </View>

        {account.isGuest ? (
          <View style={[styles.household, { backgroundColor: skin.colors.accent }]}>
            <GuestCard account={account} ink={skin.colors.onPaper} />
          </View>
        ) : (
          <>
            <View
              style={[styles.household, { backgroundColor: skin.colors.accent }]}
            >
              <ThemedText size={skin.type.label}>{copy.household}</ThemedText>
              <Title size={skin.type.headline} lines={1} header={false}>
                {caseFor(skin, householdName || copy.householdFallback)}
              </Title>
              <View style={styles.codeRow}>
                <ThemedText mono size={skin.type.mono} style={styles.flex}>
                  {common.code(joinCode)}
                </ThemedText>
                <KilButton
                  height={skin.size.button.sm}
                  fontSize={skin.type.label}
                  label={copy.share}
                  accessibilityLabel={common.shareHouseholdAria}
                  style={styles.chip}
                  onTouch={account.shareCode}
                />
                <KilButton
                  height={skin.size.button.sm}
                  fontSize={skin.type.label}
                  label={copy.qr}
                  accessibilityLabel={common.qrHouseholdAria}
                  style={styles.chip}
                  onTouch={() => setOpenPanel("qr")}
                />
              </View>
              <View style={styles.members}>
                {members.map((member) => (
                  <ThemedText key={member.id} numberOfLines={1} size={skin.type.lead}>
                    {caseFor(skin, member.id === user.id ? user.username : member.username) +
                      (member.id === user.id ? copy.you : "")}
                  </ThemedText>
                ))}
              </View>
            </View>
            <View style={{ backgroundColor: skin.colors.accent }}>
              <ActionRow
                label={copy.switch}
                onPress={() => setOpenPanel("switch")}
                showChevron
              />
            </View>

          </>
        )}

        <View style={{ backgroundColor: skin.colors.paper }}>
          <ActionRow
            label={copy.suggested}
            onPress={account.replayOnboarding}
            showChevron
          />
          <ActionRow
            label={copy.refine}
            onPress={account.refineFoods}
            showChevron
          />
          <ActionRow
            label={`${common.language} · ${account.languageName}`.toUpperCase()}
            onPress={account.openLanguage}
            showChevron
          />
          <ActionRow label={account.looksLabel.toUpperCase()} onPress={account.openLooks} showChevron />
          <ActionRow label={common.notifications.menu.toUpperCase()} onPress={account.openNotifications} showChevron />
          {account.needsEmailCode && (
            <ActionRow label={common.emailCode.menu.toUpperCase()} onPress={account.openEmailCode} showChevron />
          )}
          <ActionRow
            label={copy.credits}
            onPress={account.openCredits}
            showChevron
          />
        </View>

        {!account.isGuest && (
          <>
            <View style={styles.dangerHead}>
              <ThemedText size={skin.type.label} color={skin.colors.onGround}>
                {copy.dangerTitle}
              </ThemedText>
            </View>
            <View style={{ backgroundColor: skin.colors.paper, paddingBottom: skin.spacing.section }}>
              <ActionRow label={copy.logout} onPress={account.logOut} />
              {!account.isAdmin && (
                <ActionRow
                  label={copy.delete}
                  onPress={() => setOpenPanel("delete")}
                  destructive
                />
              )}
            </View>
          </>
        )}
      </ScrollView>

      <AccountPanels account={account} />
    </KeyboardAvoidingView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    nameRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
    },
    hero: {
      gap: s.spacing.tight,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    household: {
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
      paddingTop: s.spacing.section,
    },
    codeRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
      marginTop: s.spacing.inline,
    },
    chip: {
      paddingHorizontal: s.spacing.dock,
    },
    dangerHead: {
      paddingBottom: s.spacing.small,
      paddingHorizontal: s.spacing.gutter,
      paddingTop: s.spacing.page,
    },
    members: {
      gap: s.spacing.hair,
      marginTop: s.spacing.inline,
    },
  });

export default RoastAccount;
