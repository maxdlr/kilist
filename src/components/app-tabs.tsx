import { ThemedText } from "@/components/themed-text";
import { useSkin } from "@/providers/SkinProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TABS: Record<string, { label: string; aria: string; struck?: boolean }> = {
  index: { label: "HOME", aria: "Home" },
  list: { label: "LIST", aria: "List", struck: true },
  shop: { label: "SHOP", aria: "Shop" },
  swipe: { label: "SWIPE", aria: "Swipe" },
  account: { label: "ME", aria: "Account" },
};

type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const SkinTabBar = ({ state, navigation }: TabBarProps) => {
  const skin = useSkin();
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
        const tab = TABS[route.name];
        if (!tab) return null;
        const isCurrent = state.index === index;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={tab.aria}
            accessibilityState={{ selected: isCurrent }}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isCurrent && !event.defaultPrevented) {
                navigation.navigate(route.name);
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
              color={isCurrent ? skin.colors.onGround : skin.colors.muted}
              style={tab.struck && styles.struck}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </Animated.View>
  );
};

export default function AppTabs() {
  const skin = useSkin();

  return (
    <Tabs
      tabBar={(props) => <SkinTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: skin.colors.ground },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="list" />
      <Tabs.Screen name="shop" />
      <Tabs.Screen name="swipe" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}

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
  struck: {
    textDecorationLine: "line-through",
  },
});
