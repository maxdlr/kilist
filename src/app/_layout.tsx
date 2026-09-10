import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import fetcher, { onError } from "@/services/fetcher";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { SWRConfig } from "swr";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SWRConfig value={{ fetcher, onError }}>
        <AnimatedSplashOverlay />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="[id]" options={{ title: "" }} />
        </Stack>
      </SWRConfig>
    </ThemeProvider>
  );
}
