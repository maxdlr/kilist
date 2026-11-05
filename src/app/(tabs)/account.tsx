import type { Skin } from "@/skins/types";
import ActionPanel from "@/components/elements/ActionPanel";
import ActionRow from "@/components/elements/ActionRow";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import InviteQrModal from "@/components/views/Account/_components/InviteQrModal";
import SkinPickerModal from "@/components/views/Account/_components/SkinPickerModal";
import SwitchHouseholdModal from "@/components/views/Account/_components/SwitchHouseholdModal";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import useAuth from "@/providers/AuthProvider";
import useHousehold from "@/providers/HouseholdProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, ScrollView, Share, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Panel = "switch" | "qr" | "delete" | "skin";

const AccountScreen = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.account;
  const insets = useSafeAreaInsets();
  const { user, logout, deleteAccount } = useAuth();
  const { household, switchHousehold } = useHousehold();
  const { showToast } = useToast();
  const [openPanel, setOpenPanel] = useState<Panel | null>(null);
  const closePanel = useCallback(() => setOpenPanel(null), []);

  useStatusBarStyle(skin.statusBarOnGround);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const deleteRequest = {
    title: copy.deleteTitle,
    message: copy.deleteLine,
    cancelLabel: copy.deleteKeep,
    actions: [
      {
        label: copy.deleteAction,
        destructive: true,
        onPress: async () => {
          const success = await deleteAccount();
          if (success) router.replace("/login");
        },
      },
    ],
  };

  if (!user) return null;

  const joinCode = household?.joinCode ?? user.household.joinCode;
  const householdName = household?.name ?? user.household.name;
  const members = household?.members ?? [];

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `Join my household on Kilist with this code: ${joinCode}`,
      });
    } catch {
      showToast("Couldn't open the share menu");
    }
  };

  const handleOpenIcons8 = async () => {
    try {
      await Linking.openURL("https://icons8.com");
    } catch {
      showToast("Couldn't open the link");
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="height">
      <ScrollView
        style={[styles.flex, { backgroundColor: skin.colors.ground }]}
      >
        <View style={[styles.hero, { paddingTop: insets.top + skin.spacing.top }]}>
          <Title size={skin.type.display.sm} lines={2} color={skin.colors.onGround}>
            {copy.hello(user.username.toUpperCase())}
          </Title>
          <ThemedText mono size={skin.type.mono} color={skin.colors.onGround}>
            {user.email}
          </ThemedText>
        </View>

        <View
          style={[styles.household, { backgroundColor: skin.colors.accent }]}
        >
          <ThemedText size={skin.type.label}>{copy.household}</ThemedText>
          <Title size={skin.type.headline} lines={1} header={false}>
            {(householdName || copy.householdFallback).toUpperCase()}
          </Title>
          <View style={styles.codeRow}>
            <ThemedText mono size={skin.type.mono} style={styles.flex}>
              {`Code: ${joinCode}`}
            </ThemedText>
            <KilButton
              height={skin.size.button.sm}
              fontSize={skin.type.label}
              label={copy.share}
              accessibilityLabel="Share household code"
              style={styles.chip}
              onTouch={handleShareCode}
            />
            <KilButton
              height={skin.size.button.sm}
              fontSize={skin.type.label}
              label={copy.qr}
              accessibilityLabel="Show household QR code"
              style={styles.chip}
              onTouch={() => setOpenPanel("qr")}
            />
          </View>
          <View style={styles.members}>
            {members.map((member) => (
              <ThemedText key={member.id} numberOfLines={1} size={skin.type.lead}>
                {member.username.toUpperCase() +
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

        <View style={{ backgroundColor: skin.colors.paper }}>
          <ActionRow
            label={copy.skin(skin.name)}
            onPress={() => setOpenPanel("skin")}
            showChevron
          />
          <ActionRow
            label={copy.suggested}
            onPress={() => router.push("/onboarding")}
            showChevron
          />
          <ActionRow label={copy.logout} onPress={handleLogout} />
          <ActionRow
            label={copy.credits}
            onPress={handleOpenIcons8}
            showChevron
          />
        </View>

        {user.type !== "admin" && (
          <ActionRow
            label={copy.delete}
            onPress={() => setOpenPanel("delete")}
            destructive
          />
        )}
      </ScrollView>

      <ActionPanel
        request={openPanel === "delete" ? deleteRequest : null}
        onClose={closePanel}
      />

      <InviteQrModal
        visible={openPanel === "qr"}
        joinCode={joinCode}
        onClose={closePanel}
      />

      <SkinPickerModal visible={openPanel === "skin"} onClose={closePanel} />

      <SwitchHouseholdModal
        visible={openPanel === "switch"}
        onClose={closePanel}
        onSubmit={async (choice) => {
          const success = await switchHousehold(choice);
          if (success) showToast("Household switched", "info");
          return success;
        }}
      />
    </KeyboardAvoidingView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: {
      flex: 1,
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
    members: {
      gap: s.spacing.hair,
      marginTop: s.spacing.inline,
    },
  });

export default AccountScreen;
