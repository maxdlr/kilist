import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import SwitchHouseholdModal from "@/components/views/Account/_components/SwitchHouseholdModal";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import useAuth from "@/providers/AuthProvider";
import useHousehold from "@/providers/HouseholdProvider";
import useToast from "@/providers/ToastProvider";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";

const AccountScreen = () => {
  const { user, logout, deleteAccount } = useAuth();
  const { household, switchHousehold } = useHousehold();
  const { showToast } = useToast();
  const theme = useTheme();
  const [switchVisible, setSwitchVisible] = useState(false);

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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <ThemedText type="title">Account</ThemedText>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">{user.username}</ThemedText>
        <ThemedText type="small">{user.email}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">{householdName || "Household"}</ThemedText>
        <ThemedText type="small">Code: {joinCode}</ThemedText>
        <ThemedView style={styles.qrContainer}>
          <QRCode
            value={joinCode}
            size={160}
            color={theme.text}
            backgroundColor={theme.background}
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="smallBold">
          Members{members.length ? ` (${members.length})` : ""}
        </ThemedText>
        {members.map((member) => (
          <ThemedView key={member.id} style={styles.memberRow}>
            <ThemedText>
              {member.username}
              {member.id === user.id ? " (you)" : ""}
            </ThemedText>
            <ThemedText type="small">{member.email}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>

      <KilButton
        label="Join or create another household"
        onTouch={() => setSwitchVisible(true)}
      />

      <KilButton
        label="Run setup again"
        onTouch={() => router.push("/onboarding")}
      />

      <KilButton label="Log out" onTouch={handleLogout} />

      {user.type !== "admin" && (
        <KilButton label="Delete my account" onTouch={handleDeleteAccount} />
      )}

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
    gap: Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  section: {
    gap: Spacing.one,
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: Spacing.three,
  },
  memberRow: {
    gap: Spacing.half,
    paddingVertical: Spacing.one,
  },
});

export default AccountScreen;
