import common from "@/i18n/common";
import type { Skin } from "@/skins/types";
import BackBar from "@/components/elements/BackBar";
import ActionPanel from "@/components/elements/ActionPanel";
import BottomPanel from "@/components/elements/BottomPanel";
import { ThemedText } from "@/components/elements/ThemedText";
import axios from "@/services/axios";
import { googleSignInAvailable } from "@/services/googleSignIn";
import Dock from "@/components/elements/Dock";
import FormInput from "@/components/elements/FormInput";
import KilButton from "@/components/elements/KilButton";
import KilToggleButton from "@/components/elements/KilToggleButton";
import QrCodeScanner from "@/components/elements/QrCodeScanner";
import { QrCodeIcon } from "@/components/icons";
import { SkinScreen } from "@/skins/screens";
import { hasRules, rules } from "@/offline/rules";
import ResetPasswordModal from "@/components/features/Auth/ResetPasswordModal";
import Title from "@/components/elements/Title";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import useToast from "@/providers/ToastProvider";
import AnimationService from "@/services/animation";
import { router, useLocalSearchParams } from "expo-router";
import { type ComponentRef, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurTargetView, BlurView } from "expo-blur";
import {
  KeyboardAvoidingView,
  useKeyboardState,
} from "react-native-keyboard-controller";
import Animated, {
  interpolateColor,
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
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
const HINT_SLIDE = 8;
const FOOTER_BLUR = 30;
const FOOTER_ANDROID_REDUCTION = 4;
const FOOTER_VEIL = 0.2;
const TINTLESS = 1;
const hintAnimation = {
  entering: FadeInDown.duration(AnimationService.enter.duration)
    .easing(AnimationService.easeOut)
    .withInitialValues({ transform: [{ translateY: HINT_SLIDE }] }),
  exiting: FadeOutDown.duration(AnimationService.exit.duration).easing(
    AnimationService.easeOut,
  ),
};

const SIGNUP_STEPS = ["name", "email", "password", "household"] as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RULES = [
  { id: "length", glyph: "8", test: (value: string) => value.length >= 8 },
  { id: "upper", glyph: "A", test: (value: string) => /[A-Z]/.test(value) },
  { id: "lower", glyph: "a", test: (value: string) => /[a-z]/.test(value) },
  { id: "number", glyph: "1", test: (value: string) => /\d/.test(value) },
  { id: "symbol", glyph: "&", test: (value: string) => /[^a-zA-Z0-9]/.test(value) },
] as const;

const MATCH_GLYPH = "=";
const BADGE = 30;
const BADGE_GLYPH = 14;

const RuleGlyph = ({ glyph, color }: { glyph: string; color: string }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <Text allowFontScaling={false} style={[styles.glyph, { color, fontFamily: skin.fonts.body?.bold ?? skin.fonts.mono }]}>
      {glyph}
    </Text>
  );
};

const RuleBadge = ({
  met,
  label,
  glyph,
  ink,
  done,
  onDone,
}: {
  met: boolean;
  label: string;
  glyph: string;
  ink: string;
  done: string;
  onDone: string;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const fill = useSharedValue(met ? 1 : 0);
  const idleLine = skin.colors.fieldLine ?? ink;
  const onStyle = useAnimatedStyle(() => ({
    opacity: fill.value,
    transform: [{ scale: 0.6 + 0.4 * fill.value }],
  }));
  const lineStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(fill.value, [0, 1], [idleLine, done]),
  }));

  useEffect(() => {
    fill.set(withTiming(met ? 1 : 0, { duration: AnimationService.enter.duration, easing: AnimationService.easeOut }));
  }, [met, fill]);

  return (
    <Animated.View
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked: met }}
      accessibilityLabel={label}
      style={[styles.badge, lineStyle]}
    >
      <View style={styles.badgeOff}>
        <RuleGlyph glyph={glyph} color={ink} />
      </View>
      <Animated.View style={[styles.badgeOn, { backgroundColor: done }, onStyle]}>
        <RuleGlyph glyph={glyph} color={onDone} />
      </Animated.View>
    </Animated.View>
  );
};

const LoginScreen = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.login;
  const insets = useSafeAreaInsets();
  const {
    login,
    signup,
    loginWithGoogle,
    completeJoin,
    isGuest,
    mergePending,
    resolveMerge,
    guestName,
  } = useAuth();
  const [joinStep, setJoinStep] = useState(false);
  const [emailCode, setEmailCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const guestCopy = skin.copy.guest;
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<"login" | "signup">(
    params.mode === "signup" ? "signup" : "login",
  );
  const [mergeOpen, setMergeOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [householdChoice, setHouseholdChoice] = useState<"join" | "create">(
    "create",
  );

  const [username, setUsername] = useState(
    params.mode === "signup" ? guestName : "",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const isKeyboardOpen = useKeyboardState((state) => state.isVisible);

  const [step, setStep] = useState(0);
  const blurTarget = useRef<ComponentRef<typeof View>>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [creating, setCreating] = useState(false);
  const isSignup = mode === "signup";
  const stepId = SIGNUP_STEPS[step];
  const isLastStep = step === SIGNUP_STEPS.length - 1;
  const ruleState = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    glyph: rule.glyph,
    met: rule.test(password),
  }));
  const passwordStrong = ruleState.every((rule) => rule.met);
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const nameRules = hasRules() ? rules().accounts : undefined;
  const nameLength = username.trim().length;
  const stepFilled = {
    name:
      nameLength >= (nameRules?.usernameMin ?? 1) &&
      nameLength <= (nameRules?.usernameMax ?? Infinity),
    email: email.trim().length > 0,
    password: passwordStrong && passwordsMatch,
    household: householdChoice === "create" || joinCode.trim().length > 0,
  }[stepId];
  const canSubmit = isSignup
    ? stepFilled
    : username.trim().length > 0 && password.length > 0;
  useStatusBarStyle(isSignup ? "dark" : skin.statusBarOnGround);

  const wipe = useSharedValue(-SCREEN_WIDTH);
  const wipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: wipe.value }],
  }));

  const switchMode = (next: "login" | "signup") => {
    wipe.set(
      withTiming(0, { duration: WIPE_DURATION, easing }, () => {
        scheduleOnRN(setMode, next);
        scheduleOnRN(setStep, 0);
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
      if (stepId === "email" && !EMAIL_REGEX.test(email.trim())) {
        showToast(common.emailInvalid);
        return;
      }
      if (!isLastStep) {
        setStep((current) => current + 1);
        return;
      }
      if (householdChoice === "join" && !joinCode) {
        showToast(common.householdCodeMissing);
        return;
      }

      setCreating(true);
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
      if (result !== true) setCreating(false);
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

  const handleGoogle = async () => {
    const result = await loginWithGoogle();
    if (!result) return;
    if (result === "merge") {
      setMergeOpen(true);
      return;
    }
    router.replace("/");
  };

  const finishJoin = async (withCode: boolean) => {
    const done = await completeJoin(
      withCode ? { joinCode, code: emailCode } : null,
    );
    if (done) setJoinStep(false);
  };

  const sendCode = async () => {
    try {
      await axios.post("/me/email/code", {}, { network: true } as object);
      if (codeSent) showToast(common.emailCode.sent, "info");
      setCodeSent(true);
    } catch (error: any) {
      showToast(error?.response?.data?.message || common.needsConnection);
    }
  };

  const chooseMerge = async (keep: boolean) => {
    const done = await resolveMerge(keep);
    if (done) router.replace("/");
    else setMergeOpen(true);
  };

  const signupSheet = skin.colors.signup ?? {
    fill: skin.colors.alert,
    ink: skin.colors.onAlert,
  };

  const googleVariant = isSignup ? "secondaryOnLight" : "secondary";

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
        <BlurTargetView
          ref={blurTarget}
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
              {
                paddingTop: insets.top + skin.spacing.top,
                paddingBottom: footerHeight + skin.spacing.section,
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {!isSignup && (
              <View style={styles.step}>
                <View style={styles.question}>
                  <Title
                    size={skin.type.display.md}
                    lines={2}
                    color={skin.colors.accent}
                  >
                    {copy.loginTitle}
                  </Title>
                  <ThemedText
                    size={skin.type.body}
                    color={skin.colors.onGround}
                  >
                    {copy.loginLine}
                  </ThemedText>
                </View>
                <FormInput
                  autoFocus
                  placeholder={copy.loginName}
                  autoCapitalize="none"
                  value={username}
                  onChangeText={setUsername}
                />
                <FormInput
                  placeholder={skin.copy.placeholders.password}
                  type="password"
                  returnKeyType="go"
                  onSubmitEditing={() => canSubmit && handleSubmit()}
                  value={password}
                  onChangeText={setPassword}
                />
                <KilButton
                  variant="ghost"
                  height={skin.size.button.xs}
                  fontSize={skin.type.label}
                  label={common.reset.link}
                  onTouch={() => setResetOpen(true)}
                  style={styles.forgot}
                />
              </View>
            )}

            {isSignup && (
              <ThemedText
                size={skin.type.label}
                color={signupSheet.ink}
                style={styles.stepLabel}
              >
                {copy.signupStep(step + 1, SIGNUP_STEPS.length)}
              </ThemedText>
            )}

            {isSignup && (
              <Animated.View
                key={
                  stepId === "household"
                    ? `household-${householdChoice}`
                    : stepId
                }
                {...swapAnimation}
                style={styles.step}
              >
                <View style={styles.question}>
                  <Title
                    size={skin.type.display.md}
                    lines={2}
                    color={signupSheet.ink}
                  >
                    {stepId === "name"
                      ? copy.nameTitle
                      : stepId === "email"
                        ? copy.emailTitle
                        : stepId === "password"
                          ? copy.passwordTitle
                          : householdChoice === "create"
                            ? copy.householdNewTitle
                            : copy.householdJoinTitle}
                  </Title>
                  <ThemedText size={skin.type.body} color={signupSheet.ink}>
                    {stepId === "name"
                      ? copy.nameLine
                      : stepId === "email"
                        ? copy.emailLine
                        : stepId === "password"
                          ? copy.passwordLine
                          : householdChoice === "create"
                            ? copy.householdNewLine
                            : copy.householdJoinLine}
                  </ThemedText>
                </View>

                {stepId === "name" && (
                  <FormInput
                    autoFocus
                    placeholder={skin.copy.placeholders.username}
                    autoCapitalize="none"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => canSubmit && handleSubmit()}
                    value={username}
                    onChangeText={setUsername}
                    maxLength={nameRules?.usernameMax}
                  />
                )}
                {stepId === "name" && nameRules && (
                  <ThemedText
                    size={skin.type.label}
                    color={signupSheet.ink}
                    style={styles.fieldNote}
                  >
                    {common.nameLength(nameRules.usernameMin, nameRules.usernameMax)}
                  </ThemedText>
                )}

                {stepId === "email" && (
                  <FormInput
                    autoFocus
                    placeholder={skin.copy.placeholders.email}
                    type="email"
                    returnKeyType="next"
                    submitBehavior="submit"
                    onSubmitEditing={() => canSubmit && handleSubmit()}
                    value={email}
                    onChangeText={setEmail}
                  />
                )}

                {stepId === "password" && (
                  <>
                    <FormInput
                      autoFocus
                      placeholder={skin.copy.placeholders.password}
                      type="password"
                      value={password}
                      onChangeText={setPassword}
                    />
                    <FormInput
                      placeholder={skin.copy.placeholders.confirm}
                      type="password"
                      returnKeyType="next"
                      submitBehavior="submit"
                      onSubmitEditing={() => canSubmit && handleSubmit()}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <View style={styles.rules}>
                      {ruleState.map((rule) => (
                        <RuleBadge
                          key={rule.id}
                          met={rule.met}
                          glyph={rule.glyph}
                          label={common.passwordRules[rule.id]}
                          ink={signupSheet.ink}
                          done={skin.actions.primary.fill}
                          onDone={skin.actions.primary.ink}
                        />
                      ))}
                      {confirmPassword.length > 0 && (
                        <Animated.View {...hintAnimation}>
                          <RuleBadge
                            met={passwordsMatch}
                            glyph={MATCH_GLYPH}
                            label={common.passwordRules.match}
                            ink={signupSheet.ink}
                            done={skin.actions.primary.fill}
                            onDone={skin.actions.primary.ink}
                          />
                        </Animated.View>
                      )}
                    </View>
                  </>
                )}
              </Animated.View>
            )}

            {isSignup && stepId === "household" && (
              <KilToggleButton
                value={householdChoice}
                onChange={setHouseholdChoice}
                options={[
                  { label: copy.createHousehold, value: "create" },
                  { label: copy.joinHousehold, value: "join" },
                ]}
              />
            )}

            {isSignup &&
              stepId === "household" &&
              householdChoice === "create" && (
                <Animated.View key="create" {...swapAnimation}>
                  <FormInput
                    placeholder={skin.copy.placeholders.householdName}
                    value={householdName}
                    onChangeText={setHouseholdName}
                  />
                </Animated.View>
              )}

            {isSignup &&
              stepId === "household" &&
              householdChoice === "join" &&
              !showScanner && (
                <Animated.View key="join" {...swapAnimation}>
                  <FormInput
                    placeholder={skin.copy.placeholders.householdCode}
                    value={joinCode}
                    onChangeText={setJoinCode}
                    autoCapitalize="characters"
                    maxLength={6}
                    action={{
                      label: copy.scan,
                      onPress: () => setShowScanner(true),
                      icon: QrCodeIcon,
                    }}
                  />
                </Animated.View>
              )}

            {isSignup &&
              stepId === "household" &&
              householdChoice === "join" &&
              showScanner && (
                <Animated.View
                  key="scanner"
                  {...swapAnimation}
                  style={styles.scanner}
                >
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
        </BlurTargetView>

        {!resetOpen && (
          <View
            style={styles.footer}
            onLayout={(event) =>
              setFooterHeight(event.nativeEvent.layout.height)
            }
          >
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <BlurView
                blurTarget={blurTarget}
                intensity={Platform.OS === "android" ? TINTLESS : FOOTER_BLUR}
                blurReductionFactor={
                  (TINTLESS * FOOTER_ANDROID_REDUCTION) / FOOTER_BLUR
                }
                blurMethod="dimezisBlurViewSdk31Plus"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isSignup
                      ? signupSheet.fill
                      : skin.colors.ground,
                    opacity: FOOTER_VEIL,
                  },
                ]}
              />
            </View>
            <Dock style={styles.dock} overKeyboard={isKeyboardOpen}>
              <KilButton
                height={skin.size.button.lg}
                fontSize={skin.type.title}
                label={
                  isSignup
                    ? isLastStep
                      ? copy.signupAction
                      : copy.signupNext
                    : copy.loginAction
                }
                onTouch={handleSubmit}
                disabled={!canSubmit}
              />
              {googleSignInAvailable && (!isSignup || step === 0) && (
                <KilButton
                  variant={googleVariant}
                  colors={{
                    ...skin.actions[googleVariant],
                    line: skin.actions[googleVariant].ink,
                  }}
                  small
                  label={common.google.action}
                  onTouch={handleGoogle}
                  style={styles.google}
                />
              )}
              {isSignup ? (
                <View style={styles.links}>
                  {step > 0 && (
                    <>
                      <KilButton
                        variant="ghost"
                        height={skin.size.button.xs}
                        fontSize={skin.type.label}
                        label={copy.signupBack}
                        onTouch={() => setStep((current) => current - 1)}
                      />
                      <ThemedText
                        size={skin.type.label}
                        color={skin.actions.ghost.ink}
                        importantForAccessibility="no"
                      >
                        {"·"}
                      </ThemedText>
                    </>
                  )}
                  <KilButton
                    variant="ghost"
                    height={skin.size.button.xs}
                    fontSize={skin.type.label}
                    label={copy.toLogin}
                    onTouch={() => switchMode("login")}
                  />
                  {canLeave && (
                    <>
                      <ThemedText
                        size={skin.type.label}
                        color={skin.actions.ghost.ink}
                        importantForAccessibility="no"
                      >
                        {"·"}
                      </ThemedText>
                      <KilButton
                        variant="ghost"
                        height={skin.size.button.xs}
                        fontSize={skin.type.label}
                        label={guestCopy.later}
                        onTouch={() => router.back()}
                      />
                    </>
                  )}
                </View>
              ) : (
                <View style={styles.links}>
                  <KilButton
                    variant="ghost"
                    height={skin.size.button.xs}
                    fontSize={skin.type.label}
                    label={copy.toSignup}
                    onTouch={() => switchMode("signup")}
                  />
                  {canLeave && (
                    <>
                      <ThemedText
                        size={skin.type.label}
                        color={skin.actions.ghost.ink}
                        importantForAccessibility="no"
                      >
                        {"·"}
                      </ThemedText>
                      <KilButton
                        variant="ghost"
                        height={skin.size.button.xs}
                        fontSize={skin.type.label}
                        label={guestCopy.later}
                        onTouch={() => router.back()}
                      />
                    </>
                  )}
                </View>
              )}
            </Dock>
          </View>
        )}

        <ResetPasswordModal
          visible={resetOpen}
          onClose={() => setResetOpen(false)}
        />

        <ActionPanel
          request={
            mergeOpen
              ? {
                  title: guestCopy.mergeTitle,
                  message: guestCopy.mergeLine,
                  cancelLabel: guestCopy.later,
                  actions: [
                    {
                      label: guestCopy.mergeDiscard,
                      destructive: true,
                      onPress: () => chooseMerge(false),
                    },
                    {
                      label: guestCopy.mergeKeep,
                      onPress: () => chooseMerge(true),
                    },
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
            {codeSent
              ? common.emailGate.joinLine(email)
              : common.emailGate.joinSendLine(email)}
          </ThemedText>
          {codeSent ? (
            <>
              <FormInput
                placeholder={common.emailCode.code}
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
                onTouch={sendCode}
              />
            </>
          ) : (
            <KilButton
              height={skin.size.button.md}
              fontSize={skin.type.lead}
              label={common.emailCode.send}
              onTouch={sendCode}
            />
          )}
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

  if (creating) return <SkinScreen slot="Loading" />;

  return canLeave ? (
    <BackBar
      fill={isSignup ? signupSheet.fill : undefined}
      ink={isSignup ? signupSheet.ink : undefined}
    >
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
      justifyContent: "flex-start",
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    stepLabel: { opacity: 0.7 },
    rules: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.small,
      justifyContent: "center",
      paddingTop: s.spacing.small,
    },
    badge: {
      alignItems: "center",
      borderRadius: BADGE / 2,
      borderWidth: Math.max(1, s.shape.border),
      height: BADGE,
      justifyContent: "center",
      overflow: "hidden",
      width: BADGE,
    },
    badgeOff: { opacity: 0.45 },
    badgeOn: {
      alignItems: "center",
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      borderRadius: BADGE / 2,
      justifyContent: "center",
    },
    glyph: {
      fontSize: BADGE_GLYPH,
      includeFontPadding: false,
      lineHeight: BADGE_GLYPH + 2,
      textAlign: "center",
      textAlignVertical: "center",
    },
    step: { gap: s.spacing.inline },
    fieldNote: {
      opacity: 0.7,
      paddingHorizontal: s.shape.pill ? s.spacing.stack + 2 : s.spacing.inline,
    },
    question: { gap: s.spacing.small, marginBottom: s.spacing.stack },
    scanner: {
      gap: s.spacing.inline,
    },
    google: {
      marginBottom: s.spacing.small,
      marginTop: s.spacing.stack,
    },
    links: {
      alignItems: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.tight,
      justifyContent: "center",
    },
    forgot: { alignSelf: "flex-end" },
    footer: { bottom: 0, left: 0, position: "absolute", right: 0 },
    dock: {
      backgroundColor: "transparent",
      gap: s.spacing.hair,
      paddingBottom: s.spacing.section,
    },
  });

export default LoginScreen;
