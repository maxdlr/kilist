import KilButton from "@/components/elements/KilButton";
import FormInput from "@/components/elements/FormInput";
import QrCodeScanner from "@/components/elements/QrCodeScanner";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import useAuth from "@/providers/AuthProvider";
import useToast from "@/providers/ToastProvider";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

const LoginScreen = () => {
  const { login, signup } = useAuth();
  const { showToast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [householdChoice, setHouseholdChoice] = useState<"join" | "create">(
    "create",
  );

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async () => {
    if (isSignup) {
      if (password !== confirmPassword) {
        showToast("Passwords do not match");
        return;
      }
      if (!STRONG_PASSWORD_REGEX.test(password)) {
        showToast(
          "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol",
        );
        return;
      }
      if (householdChoice === "join" && !joinCode) {
        showToast("Enter a household code to join");
        return;
      }

      const success = await signup({
        username,
        email,
        password,
        ...(householdChoice === "join"
          ? { householdChoice: "join", joinCode }
          : { householdChoice: "create", householdName: householdName || undefined }),
      });
      if (success) router.replace("/onboarding");
      return;
    }

    const success = await login(username, password);
    if (success) router.replace("/");
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{isSignup ? "Sign up" : "Log in"}</ThemedText>

      <FormInput
        label="Username"
        value={username}
        onChangeText={setUsername}
      />

      {isSignup && (
        <FormInput
          label="Email"
          type="email"
          value={email}
          onChangeText={setEmail}
        />
      )}

      <FormInput
        label="Password"
        type="password"
        value={password}
        onChangeText={setPassword}
      />

      {isSignup && (
        <FormInput
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      )}

      {isSignup && (
        <ThemedView style={styles.householdSection}>
          <ThemedText type="small">Household</ThemedText>
          <ThemedView style={styles.householdToggle}>
            <KilButton
              label="Create new"
              onTouch={() => setHouseholdChoice("create")}
              style={{
                container: {
                  opacity: householdChoice === "create" ? 1 : 0.5,
                },
              }}
            />
            <KilButton
              label="Join existing"
              onTouch={() => setHouseholdChoice("join")}
              style={{
                container: {
                  opacity: householdChoice === "join" ? 1 : 0.5,
                },
              }}
            />
          </ThemedView>

          {householdChoice === "create" ? (
            <FormInput
              label="Household name (optional)"
              value={householdName}
              onChangeText={setHouseholdName}
            />
          ) : showScanner ? (
            <ThemedView style={{ gap: Spacing.two }}>
              <QrCodeScanner
                onScanned={(data) => {
                  setJoinCode(data);
                  setShowScanner(false);
                }}
              />
              <ThemedText type="link" onPress={() => setShowScanner(false)}>
                Enter code manually instead
              </ThemedText>
            </ThemedView>
          ) : (
            <ThemedView style={{ gap: Spacing.two }}>
              <FormInput
                label="Household code"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                maxLength={6}
              />
              <ThemedText type="link" onPress={() => setShowScanner(true)}>
                Scan QR code instead
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}

      <KilButton label={isSignup ? "Sign up" : "Log in"} onTouch={handleSubmit} />

      <ThemedText
        type="link"
        onPress={() => setMode(isSignup ? "login" : "signup")}
      >
        {isSignup
          ? "Already have an account? Log in"
          : "No account yet? Sign up"}
      </ThemedText>
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
  householdSection: {
    gap: Spacing.two,
  },
  householdToggle: {
    flexDirection: "row",
    gap: Spacing.two,
  },
});

export default LoginScreen;
