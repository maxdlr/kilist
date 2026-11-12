import { DarkTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useReducedMotion } from "react-native-reanimated";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SWRConfig } from "swr";
import AnimationService from "@/services/animation";
import fetcher, { onError } from "@/services/fetcher";

import AuthGate from "@/components/AuthGate";
import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { AuthProvider } from "@/providers/AuthProvider";
import { LanguageProvider, useLanguage } from "@/providers/LanguageProvider";
import { SkinProvider, useSkin } from "@/providers/SkinProvider";
import { MarkProvider } from "@/providers/MarkProvider";
import { ToastProvider } from "@/providers/ToastProvider";

SplashScreen.preventAutoHideAsync();

const SkinnedApp = () => {
  const skin = useSkin();
  const { lang } = useLanguage();
  const reduced = useReducedMotion();
  const navigationTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: skin.colors.ground,
        card: skin.colors.ground,
        text: skin.colors.onGround,
      },
    }),
    [skin],
  );

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={skin.statusBarOnGround} />
      <ToastProvider>
        <MarkProvider>
        <AnimatedSplashOverlay />
        <AuthProvider>
          <Stack key={lang} screenOptions={{
              animation: reduced ? "fade" : "slide_from_right",
              animationDuration: AnimationService.screen.duration,
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="[id]" options={{ title: "" }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
          </Stack>
          <AuthGate />
        </AuthProvider>
        </MarkProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SWRConfig value={{ fetcher, onError }}>
          <LanguageProvider>
          <SkinProvider>
            <SkinnedApp />
          </SkinProvider>
          </LanguageProvider>
        </SWRConfig>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
