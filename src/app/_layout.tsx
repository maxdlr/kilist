import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import fetcher, { onError } from "@/services/fetcher";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import { SWRConfig } from "swr";

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SWRConfig value={{ fetcher, onError }}>
        <AnimatedSplashOverlay />
        <AppTabs />
      </SWRConfig>
    </ThemeProvider>
  );
}
