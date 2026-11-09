import common from "@/i18n/common";
import type { Skin } from "@/skins/types";
import Dock from "@/components/elements/Dock/Dock";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import KilToggleButton from "@/components/elements/KilToggleButton";
import QrCodeScanner from "@/components/elements/QrCodeScanner";
import Title from "@/components/elements/Title/Title";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import AnimationService from "@/services/animation";
import { router } from "expo-router";
import { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView, useKeyboardState } from "react-native-keyboard-controller";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

const SWAP_DURATION = 200;
const WIPE_DURATION = 170;
const { easing } = AnimationService.config;
const swapAnimation = {
  entering: FadeIn.duration(SWAP_DURATION).easing(easing),
  exiting: FadeOut.duration(SWAP_DURATION).easing(easing),
};
const SCREEN_WIDTH = Dimensions.get("window").width;

const STRONG_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

const LoginScreen = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.login;
  const insets = useSafeAreaInsets();
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
  const isKeyboardOpen = useKeyboardState((state) => state.isVisible);

  const isSignup = mode === "signup";
  useStatusBarStyle(isSignup ? "dark" : skin.statusBarOnGround);

  const wipe = useSharedValue(-SCREEN_WIDTH);
  const wipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: wipe.value }],
  }));

  const switchMode = (next: "login" | "signup") => {
    wipe.set(
      withTiming(0, { duration: WIPE_DURATION, easing }, () => {
        scheduleOnRN(setMode, next);
        wipe.set(
          withTiming(SCREEN_WIDTH, { duration: WIPE_DURATION, easing }, () => {
            wipe.set(-SCREEN_WIDTH);
          }),
        );
      }),
    );
  };

  const handleSubmit = async () => {
    if (isSignup) {
      if (password !== confirmPassword) {
        showToast(common.passwordsDiffer);
        return;
      }
      if (!STRONG_PASSWORD_REGEX.test(password)) {
        showToast(
          "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number and a symbol",
        );
        return;
      }
      if (householdChoice === "join" && !joinCode) {
        showToast(common.householdCodeMissing);
        return;
      }

      await signup({
        username,
        email,
        password,
        ...(householdChoice === "join"
          ? { householdChoice: "join", joinCode }
          : {
              householdChoice: "create",
              householdName: householdName || undefined,
            }),
      });
      return;
    }

    const success = await login(username, password);
    if (success) router.replace("/");
  };

  const signupSheet = skin.colors.signup ?? { fill: skin.colors.alert, ink: skin.colors.onAlert };
  const labelColor = isSignup ? skin.colors.onPaper : skin.colors.accent;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <View
        style={[
          styles.flex,
          {
            backgroundColor: isSignup ? signupSheet.fill : skin.colors.ground,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.form,
            { paddingTop: insets.top + skin.spacing.top },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {!isKeyboardOpen && (
            <Title
              size={isSignup ? 76 : 124}
              lines={isSignup ? 1 : 2}
              color={isSignup ? signupSheet.ink : skin.colors.accent}
              style={styles.title}
            >
              {isSignup ? copy.signupTitle : copy.loginTitle}
            </Title>
          )}

          <FormInput
            label={copy.username}
            placeholder={skin.copy.placeholders.username}
            labelColor={labelColor}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          {isSignup && (
            <FormInput
              label={copy.email}
              placeholder={skin.copy.placeholders.email}
              labelColor={labelColor}
              type="email"
              value={email}
              onChangeText={setEmail}
            />
          )}

          <FormInput
            label={copy.password}
            placeholder={skin.copy.placeholders.password}
            labelColor={labelColor}
            type="password"
            value={password}
            onChangeText={setPassword}
          />

          {isSignup && (
            <FormInput
              label={copy.confirm}
              placeholder={skin.copy.placeholders.confirm}
              labelColor={labelColor}
              type="password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          )}

          {isSignup && (
            <KilToggleButton
              value={householdChoice}
              onChange={setHouseholdChoice}
              options={[
                { label: copy.createHousehold, value: "create" },
                { label: copy.joinHousehold, value: "join" },
              ]}
            />
          )}

          {isSignup && householdChoice === "create" && (
            <Animated.View key="create" {...swapAnimation}>
              <FormInput
                label={copy.householdName}
                placeholder={skin.copy.placeholders.householdName}
                value={householdName}
                onChangeText={setHouseholdName}
              />
            </Animated.View>
          )}

          {isSignup && householdChoice === "join" && !showScanner && (
            <Animated.View key="join" {...swapAnimation}>
              <FormInput
                label={copy.householdCode}
                placeholder={skin.copy.placeholders.householdCode}
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                maxLength={6}
                action={{
                  label: copy.scan,
                  onPress: () => setShowScanner(true),
                }}
              />
            </Animated.View>
          )}

          {isSignup && householdChoice === "join" && showScanner && (
            <Animated.View key="scanner" {...swapAnimation} style={styles.scanner}>
              <QrCodeScanner
                onScanned={(data) => {
                  setJoinCode(data);
                  setShowScanner(false);
                }}
              />
              <KilButton
                height={skin.size.button.sm}
                fontSize={skin.type.label}
                label={copy.typeCode}
                variant="secondaryOnLight"
                onTouch={() => setShowScanner(false)}
              />
            </Animated.View>
          )}
        </ScrollView>

        <Dock style={styles.dock} overKeyboard={isKeyboardOpen}>
          <KilButton
            height={isSignup ? 68 : 84}
            fontSize={isSignup ? 34 : 42}
            label={isSignup ? copy.signupAction : copy.loginAction}
            onTouch={handleSubmit}
          />
          <KilButton
            variant="ghost"
            height={skin.size.button.xs}
            fontSize={skin.type.label}
            label={isSignup ? copy.toLogin : copy.toSignup}
            onTouch={() => switchMode(isSignup ? "login" : "signup")}
          />
        </Dock>

        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: skin.colors.paper },
            wipeStyle,
          ]}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    form: {
      flexGrow: 1,
      gap: s.spacing.inline,
      justifyContent: "flex-end",
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    title: {
      marginBottom: "auto",
    },
    scanner: {
      gap: s.spacing.inline,
    },
    dock: {
      gap: s.spacing.hair,
      paddingBottom: s.spacing.section,
    },
  });

export default LoginScreen;
