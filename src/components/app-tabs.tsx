import { ThemedText } from "@/components/themed-text";
import useAuth from "@/providers/AuthProvider";
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

const TAB_ARIA: Record<string, string> = {
  index: "Home",
  list: "List",
  shop: "Shop",
  swipe: "Swipe",
  account: "Account",
  admin: "Admin",
};

type TabBarProps = Parameters<
  NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const SkinTabBar = ({ state, navigation }: TabBarProps) => {
  const skin = useSkin();
  const { user } = useAuth();
  const isAdmin = user?.type === "admin";
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
        if (!label || (name === "admin" && !isAdmin)) return null;
        const struck = name === "list" && skin.game.strikeListTab;
        const isCurrent = state.index === index;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={TAB_ARIA[name]}
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
              style={struck && styles.struck}
            >
              {label}
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
      <Tabs.Screen name="admin" />
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
