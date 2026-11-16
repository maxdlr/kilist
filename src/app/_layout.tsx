import { DarkTheme, ThemeProvider } from "expo-router";
import { Stack } from "expo-router/js-stack";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SWRConfig } from "swr";
import { useSlideStackOptions } from "@/services/screenSlide";
import fetcher, { onError } from "@/services/fetcher";

import AuthGate from "@/components/guards/AuthGate";
import { AnimatedSplashOverlay } from "@/components/navigation/AnimatedSplashOverlay";
import { AuthProvider } from "@/providers/AuthProvider";
import { LanguageProvider, useLanguage } from "@/providers/LanguageProvider";
import { SkinProvider, useSkin } from "@/providers/SkinProvider";
import { MarkProvider } from "@/providers/MarkProvider";
import { ToastProvider } from "@/providers/ToastProvider";

configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

SplashScreen.preventAutoHideAsync();

const RUNTIME_FONTS = {
  "Inter-Bold": require("../../assets/fonts/Inter-Bold.ttf"),
  "Inter-Black": require("../../assets/fonts/Inter-Black.ttf"),
};

const SkinnedApp = () => {
  const skin = useSkin();
  const { lang } = useLanguage();
  const slideOptions = useSlideStackOptions();
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
          <Stack key={lang} screenOptions={slideOptions}>
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
  const [fontsLoaded, fontsFailed] = useFonts(RUNTIME_FONTS);
  if (!fontsLoaded && !fontsFailed) return null;

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
