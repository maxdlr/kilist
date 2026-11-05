import { ThemedText } from "@/components/themed-text";
import AccountRow from "@/components/views/Account/_components/AccountRow";
import Avatar from "@/components/views/Account/_components/Avatar";
import InviteQrModal from "@/components/views/Account/_components/InviteQrModal";
import SwitchHouseholdModal from "@/components/views/Account/_components/SwitchHouseholdModal";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import useAuth from "@/providers/AuthProvider";
import useHousehold from "@/providers/HouseholdProvider";
import useToast from "@/providers/ToastProvider";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { QrCodeIcon, ShareIcon } from "react-native-heroicons/solid";

const AccountScreen = () => {
  const { user, logout, deleteAccount } = useAuth();
  const { household, switchHousehold } = useHousehold();
  const { showToast } = useToast();
  const theme = useTheme();
  const [switchVisible, setSwitchVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete your account?",
      "This can't be undone. If you're the last member of your household, its lists and foods are deleted too.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deleteAccount();
            if (success) router.replace("/login");
          },
        },
      ],
    );
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

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
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
              onPress={() => setQrVisible(true)}
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

        <AccountRow
          label="Switch household"
          onPress={() => setSwitchVisible(true)}
          showChevron
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.heading}>
          Account
        </ThemedText>
        <AccountRow
          label="Add suggested foods"
          onPress={() => router.push("/onboarding")}
          showChevron
        />
        <AccountRow label="Log out" onPress={handleLogout} />
      </View>

      {user.type !== "admin" && (
        <View style={styles.danger}>
          <AccountRow
            label="Delete my account"
            onPress={handleDeleteAccount}
            destructive
          />
        </View>
      )}

      <InviteQrModal
        visible={qrVisible}
        joinCode={joinCode}
        onClose={() => setQrVisible(false)}
      />

      <SwitchHouseholdModal
        visible={switchVisible}
        onClose={() => setSwitchVisible(false)}
        onSubmit={async (choice) => {
          const success = await switchHousehold(choice);
          if (success) showToast("Household switched", "info");
          return success;
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
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
