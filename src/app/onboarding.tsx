import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import useAuth from "@/providers/AuthProvider";
import { router } from "expo-router";
import { StyleSheet } from "react-native";

const OnboardingScreen = () => {
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Welcome{user ? `, ${user.username}` : ""}!</ThemedText>
      <ThemedText>Your household is ready.</ThemedText>

      {/* Reserved for a future step guiding users through building their
          initial food inventory. */}

      <KilButton label="Get started" onTouch={() => router.replace("/")} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: "100%",
    alignSelf: "center",
    justifyContent: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});

export default OnboardingScreen;
