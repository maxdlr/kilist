import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import useAuth from "@/providers/AuthProvider";
import useToast from "@/providers/ToastProvider";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { StyleSheet } from "react-native";

const AccountScreen = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const theme = useTheme();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!user) return null;

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Account</ThemedText>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">{user.username}</ThemedText>
        <ThemedText type="small">{user.email}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">
          {user.household.name || "Household"}
        </ThemedText>
        <ThemedText type="small">Code: {user.household.joinCode}</ThemedText>
        <ThemedView style={styles.qrContainer}>
          <QRCode
            value={user.household.joinCode}
            size={160}
            color={theme.text}
            backgroundColor={theme.background}
          />
        </ThemedView>
      </ThemedView>

      <KilButton
        label="Join or create another household"
        onTouch={() => showToast("Coming soon", "info")}
      />

      <KilButton label="Log out" onTouch={handleLogout} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});

export default AccountScreen;
