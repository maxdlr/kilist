import { useSkin } from "@/providers/SkinProvider";
import { SLIDE } from "@/services/screenSlide";
import { SkinTabBar, useFloatingTabBar } from "@/skins/screens";
import { Tabs } from "expo-router";
import { useMemo } from "react";
import { Animated, useWindowDimensions } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppTabs() {
  const skin = useSkin();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const floating = useFloatingTabBar();
  const scene = { backgroundColor: skin.colors.ground };
  const roomForTabBar = {
    sceneStyle: [scene, floating && { paddingBottom: skin.size.tabBar + insets.bottom }],
  };

  const slide = useMemo(
    () =>
      ({ current }: { current: { progress: Animated.Value } }) => ({
        sceneStyle: {
          transform: [
            {
              translateX: current.progress.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-width, 0, width],
              }),
            },
          ],
        },
      }),
    [width],
  );

  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <SkinTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: reduced ? "none" : "shift",
        sceneStyleInterpolator: reduced ? undefined : slide,
        transitionSpec: SLIDE,
        sceneStyle: scene,
      }}
    >
      <Tabs.Screen name="swipe" />
      <Tabs.Screen name="shop" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="inventory" />
      <Tabs.Screen name="account" />
      <Tabs.Screen name="looks" />
      <Tabs.Screen name="look-preview" options={roomForTabBar} />
      <Tabs.Screen name="admin" options={roomForTabBar} />
    </Tabs>
  );
}
