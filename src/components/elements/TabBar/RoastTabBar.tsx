import common from "@/i18n/common";
import type { TabBarProps } from "./types";
import { ThemedText } from "@/components/themed-text";
import useRoundOpen from "@/hooks/useRoundOpen";
import { MAIN_TABS, shownTab } from "./tabs";
import { useSkin } from "@/providers/SkinProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const tabAria = (name: string) =>
  common.tabs[name as keyof typeof common.tabs] ?? name;

const RoastTabBar = ({ state, emitter, navigateToTab }: TabBarProps) => {
  const skin = useSkin();
  const { pending } = useRoundOpen();
  const insets = useSafeAreaInsets();
  const { isHidden } = useTabBarVisibility();
  const fullHeight = skin.size.tabBar + insets.bottom;
  const height = useSharedValue(fullHeight);

  useEffect(() => {
    height.set(withTiming(isHidden ? 0 : fullHeight, AnimationService.config));
  }, [isHidden, fullHeight, height]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  return (
    <Animated.View
      accessibilityRole="tablist"
      style={[styles.bar, { backgroundColor: skin.colors.ground }, animatedStyle]}
    >
      {state.routes.map((route, index) => {
        const name = route.name as keyof typeof skin.copy.tabs;
        const label = skin.copy.tabs[name];
        if (!label || !MAIN_TABS.includes(route.name)) return null;
        const isActual = state.index === index;
        const isCurrent = shownTab(state.routes[state.index]?.name) === route.name;
        const open = route.name === "swipe" && pending && !isCurrent;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={tabAria(name)}
            accessibilityState={{ selected: isCurrent }}
            onPress={() => {
              const event = emitter.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isActual && !event.defaultPrevented) {
                navigateToTab(route.key);
              }
            }}
            style={[
              styles.tab,
              { paddingBottom: insets.bottom },
              isCurrent && { backgroundColor: skin.colors.raised },
            ]}
          >
            <ThemedText
              allowFontScaling={false}
              size={skin.type.label}
              color={isCurrent || open ? skin.colors.onGround : skin.colors.muted}
              style={open && styles.open}
              numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}
            >
              {label}
            </ThemedText>
          </Pressable>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    overflow: "hidden",
  },
  tab: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  open: {
    textDecorationLine: "underline",
  },
});

export default RoastTabBar;
