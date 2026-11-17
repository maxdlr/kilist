import ActionPanel from "@/components/elements/ActionPanel";
import BackBar from "@/components/elements/BackBar";
import AuthFooter from "@/components/features/Auth/AuthFooter";
import { signupSheet } from "@/components/features/Auth/authLook";
import JoinCodePanel from "@/components/features/Auth/JoinCodePanel";
import LoginForm from "@/components/features/Auth/LoginForm";
import ResetPasswordModal from "@/components/features/Auth/ResetPasswordModal";
import SignupStep from "@/components/features/Auth/SignupStep";
import useAuthFlow, { type AuthMode } from "@/hooks/screens/useAuthFlow";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import { SkinScreen } from "@/skins/screens";
import type { Skin } from "@/skins/types";
import { BlurTargetView } from "expo-blur";
import { type ComponentRef, useRef, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

const WIPE_DURATION = 170;
const SCREEN_WIDTH = Dimensions.get("window").width;
const { easing } = AnimationService.config;

const LoginScreen = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const flow = useAuthFlow();
  const guest = skin.copy.guest;
  const sheet = signupSheet(skin);
  const pageFill = flow.isSignup ? sheet.fill : skin.colors.ground;
  const blurTarget = useRef<ComponentRef<typeof View>>(null);
  const [footerHeight, setFooterHeight] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  useStatusBarStyle(flow.isSignup ? "dark" : skin.statusBarOnGround);

  const wipe = useSharedValue(-SCREEN_WIDTH);
  const wipeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: wipe.value }] }));

  const switchMode = (next: AuthMode) => {
    wipe.set(
      withTiming(0, { duration: WIPE_DURATION, easing }, () => {
        scheduleOnRN(flow.switchMode, next);
        wipe.set(
          withTiming(SCREEN_WIDTH, { duration: WIPE_DURATION, easing }, () => {
            wipe.set(-SCREEN_WIDTH);
          }),
        );
      }),
    );
  };

  if (flow.creating) return <SkinScreen slot="Loading" />;

  const screen = (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <View style={[styles.flex, { backgroundColor: pageFill }]}>
        <BlurTargetView ref={blurTarget} style={[styles.flex, { backgroundColor: pageFill }]}>
          <ScrollView
            contentContainerStyle={[
              styles.form,
              { paddingTop: insets.top + skin.spacing.top, paddingBottom: footerHeight + skin.spacing.section },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {flow.isSignup ? <SignupStep flow={flow} /> : <LoginForm flow={flow} onForgot={() => setResetOpen(true)} />}
          </ScrollView>
        </BlurTargetView>

        {!resetOpen && (
          <AuthFooter
            flow={flow}
            target={blurTarget}
            pageFill={pageFill}
            onSwitch={() => switchMode(flow.isSignup ? "login" : "signup")}
            onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
          />
        )}

        <ResetPasswordModal visible={resetOpen} onClose={() => setResetOpen(false)} />

        <ActionPanel
          request={
            flow.mergeOpen
              ? {
                  title: guest.mergeTitle,
                  message: guest.mergeLine,
                  cancelLabel: guest.later,
                  actions: [
                    { label: guest.mergeDiscard, destructive: true, onPress: () => flow.chooseMerge(false) },
                    { label: guest.mergeKeep, onPress: () => flow.chooseMerge(true) },
                  ],
                }
              : null
          }
          onClose={flow.closeMerge}
        />

        <JoinCodePanel flow={flow} />

        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: skin.colors.paper }, wipeStyle]}
        />
      </View>
    </KeyboardAvoidingView>
  );

  return flow.canLeave ? (
    <BackBar fill={flow.isSignup ? sheet.fill : undefined} ink={flow.isSignup ? sheet.ink : undefined}>
      {screen}
    </BackBar>
  ) : (
    screen
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1 },
    form: {
      flexGrow: 1,
      gap: s.spacing.inline,
      justifyContent: "flex-start",
      paddingHorizontal: s.spacing.gutter,
    },
  });

export default LoginScreen;
