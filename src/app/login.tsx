import common from "@/i18n/common";
import type { Skin } from "@/skins/types";
import BackBar from "@/components/elements/BackBar/BackBar";
import ActionPanel from "@/components/elements/ActionPanel";
import BottomPanel from "@/components/elements/BottomPanel";
import { ThemedText } from "@/components/themed-text";
import axios from "@/services/axios";
import Dock from "@/components/elements/Dock/Dock";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import KilToggleButton from "@/components/elements/KilToggleButton";
import QrCodeScanner from "@/components/elements/QrCodeScanner";
import ResetPasswordModal from "@/components/views/Login/ResetPasswordModal";
import Title from "@/components/elements/Title/Title";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import AnimationService from "@/services/animation";
import { router, useLocalSearchParams } from "expo-router";
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
  const { login, signup, completeJoin, isGuest, mergePending, resolveMerge } = useAuth();
  const [joinStep, setJoinStep] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const guestCopy = skin.copy.guest;
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<"login" | "signup">(params.mode === "signup" ? "signup" : "login");
  const [mergeOpen, setMergeOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
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

      const result = await signup({
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
      if (result === "join") setJoinStep(true);
      return;
    }

    const result = await login(username, password);
    if (!result) return;
    if (result === "merge") {
      setMergeOpen(true);
      return;
    }
    router.replace("/");
  };

  const finishJoin = async (withCode: boolean) => {
    const done = await completeJoin(withCode ? { joinCode, code: emailCode } : null);
    if (done) setJoinStep(false);
  };

  const resendCode = async () => {
    try {
      await axios.post("/me/email/code", {}, { network: true } as object);
      showToast(common.emailCode.sent, "info");
    } catch (error: any) {
      showToast(error?.response?.data?.message || common.needsConnection);
    }
  };

  const chooseMerge = async (keep: boolean) => {
    const done = await resolveMerge(keep);
    if (done) router.replace("/");
    else setMergeOpen(true);
  };

  const signupSheet = skin.colors.signup ?? { fill: skin.colors.alert, ink: skin.colors.onAlert };
  const labelColor = isSignup ? skin.colors.onPaper : skin.colors.accent;

  const canLeave = isGuest && !mergePending && router.canGoBack();

  const screen = (
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

        {!resetOpen && (
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
          {!isSignup && (
            <KilButton
              variant="ghost"
              height={skin.size.button.xs}
              fontSize={skin.type.label}
              label={common.reset.link}
              onTouch={() => setResetOpen(true)}
            />
          )}
          {canLeave && (
            <KilButton
              variant="ghost"
              height={skin.size.button.xs}
              fontSize={skin.type.label}
              label={guestCopy.later}
              onTouch={() => router.back()}
            />
          )}
        </Dock>
        )}

        <ResetPasswordModal visible={resetOpen} onClose={() => setResetOpen(false)} />

        <ActionPanel
          request={
            mergeOpen
              ? {
                  title: guestCopy.mergeTitle,
                  message: guestCopy.mergeLine,
                  cancelLabel: guestCopy.later,
                  actions: [
                    { label: guestCopy.mergeDiscard, destructive: true, onPress: () => chooseMerge(false) },
                    { label: guestCopy.mergeKeep, onPress: () => chooseMerge(true) },
                  ],
                }
              : null
          }
          onClose={() => setMergeOpen(false)}
        />

        <BottomPanel visible={joinStep} onClose={() => {}}>
          <Title size={skin.type.headline} lines={2} color={skin.panel.title}>
            {common.emailGate.joinTitle}
          </Title>
          <ThemedText size={skin.type.body} color={skin.panel.ink}>
            {common.emailGate.joinLine(email)}
          </ThemedText>
          <FormInput
            label={common.emailCode.code}
            labelColor={skin.panel.ink}
            type="number"
            maxLength={6}
            value={emailCode}
            onChangeText={setEmailCode}
          />
          <KilButton
            height={skin.size.button.md}
            fontSize={skin.type.lead}
            label={common.emailCode.confirm}
            onTouch={() => finishJoin(true)}
          />
          <KilButton
            height={skin.size.button.sm}
            fontSize={skin.type.label}
            variant={skin.panel.secondary}
            label={common.emailCode.resend}
            onTouch={resendCode}
          />
          <KilButton
            height={skin.size.button.sm}
            fontSize={skin.type.label}
            variant={skin.panel.secondary}
            label={common.emailGate.joinSkip}
            onTouch={() => finishJoin(false)}
          />
        </BottomPanel>

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

  return canLeave ? (
    <BackBar fill={isSignup ? signupSheet.fill : undefined} ink={isSignup ? signupSheet.ink : undefined}>
      {screen}
    </BackBar>
  ) : (
    screen
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
