import ActionPanel from "@/components/elements/ActionPanel";
import { ThemedText } from "@/components/themed-text";
import ActionRow from "@/components/elements/ActionRow";
import Avatar from "@/components/views/Account/_components/Avatar";
import InviteQrModal from "@/components/views/Account/_components/InviteQrModal";
import SwitchHouseholdModal from "@/components/views/Account/_components/SwitchHouseholdModal";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import useAuth from "@/providers/AuthProvider";
import useHousehold from "@/providers/HouseholdProvider";
import useToast from "@/providers/ToastProvider";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { QrCodeIcon, ShareIcon } from "react-native-heroicons/solid";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

const AccountScreen = () => {
  const { user, logout, deleteAccount } = useAuth();
  const { household, switchHousehold } = useHousehold();
  const { showToast } = useToast();
  const theme = useTheme();
  const [openPanel, setOpenPanel] = useState<"switch" | "qr" | "delete" | null>(
    null,
  );
  const closePanel = useCallback(() => setOpenPanel(null), []);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const deleteRequest = {
    title: "Delete your account?",
    message:
      "This can't be undone. If you're the last member of your household, its lists and foods are deleted too.",
    actions: [
      {
        label: "Delete",
        destructive: true,
        onPress: async () => {
          const success = await deleteAccount();
          if (success) router.replace("/login");
        },
      },
    ],
  };

  if (!user) return null;

  // Fall back to the household embedded in the user while /households/me loads.
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
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: theme.background }]}
      behavior="height"
    >
      <ScrollView
        contentContainerStyle={styles.container}
      >
        <View style={styles.profile}>
          <Avatar name={user.username} size={56} />
          <View style={styles.profileText}>
            <ThemedText type="subtitle" numberOfLines={1}>
              {user.username}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {user.email}
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.heading}>
            Household
          </ThemedText>
          <ThemedText type="subtitle">{householdName || "Household"}</ThemedText>

          <View style={styles.codeRow}>
            <ThemedText type="small">Code: {joinCode}</ThemedText>
            <View style={styles.codeActions}>
              <Pressable
                onPress={handleShareCode}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Share household code"
              >
                <ShareIcon size={22} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={() => setOpenPanel("qr")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Show household QR code"
              >
                <QrCodeIcon size={22} color={theme.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.members}>
            {members.map((member) => (
              <View key={member.id} style={styles.memberRow}>
                <Avatar name={member.username} />
                <ThemedText numberOfLines={1} style={styles.memberName}>
                  {member.username}
                  {member.id === user.id ? " (you)" : ""}
                </ThemedText>
              </View>
            ))}
          </View>

          <ActionRow
            label="Switch household"
            onPress={() => setOpenPanel("switch")}
            showChevron
          />
        </View>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.heading}>
            Account
          </ThemedText>
          <ActionRow
            label="Add suggested foods"
            onPress={() => router.push("/onboarding")}
            showChevron
          />
          <ActionRow label="Log out" onPress={handleLogout} />
        </View>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.heading}>
            Credits
          </ThemedText>
          <ActionRow
            label="Icons by Icons8"
            onPress={handleOpenIcons8}
            showChevron
          />
        </View>

        {user.type !== "admin" && (
          <View style={styles.danger}>
            <ActionRow
              label="Delete my account"
              onPress={() => setOpenPanel("delete")}
              destructive
            />
          </View>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  profileText: {
    flex: 1,
    gap: Spacing.half,
  },
  section: {
    gap: Spacing.two,
  },
  heading: {
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codeActions: {
    flexDirection: "row",
    gap: Spacing.four,
  },
  members: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  memberName: {
    flex: 1,
  },
  danger: {
    marginTop: "auto",
  },
});

export default AccountScreen;
