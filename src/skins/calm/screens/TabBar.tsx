import T from "../text";
import type { TabBarProps } from "@/components/elements/TabBar/types";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { ComponentType, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  Cog6ToothIcon,
  ListBulletIcon,
  PlayIcon,
  ShoppingBagIcon,
  SunIcon,
  WrenchIcon,
} from "react-native-heroicons/outline";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calmPalette as C } from "..";
import { Dot, useCheckPending } from "./parts";

const ORDER = ["index", "inventory", "swipe", "shop", "account", "admin"];

const ICONS: Record<string, ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  index: SunIcon,
  swipe: PlayIcon,
  shop: ShoppingBagIcon,
  inventory: ListBulletIcon,
  account: Cog6ToothIcon,
  admin: WrenchIcon,
};

const CalmTabBar = ({ state, emitter, navigateToTab }: TabBarProps) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isHidden } = useTabBarVisibility();
  const { pending } = useCheckPending();
  const fullHeight = skin.size.tabBar + insets.bottom;
  const height = useSharedValue(fullHeight);

  useEffect(() => {
    height.set(withTiming(isHidden ? 0 : fullHeight, AnimationService.config));
  }, [isHidden, fullHeight, height]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));
  const routes = ORDER.map((name) => state.routes.find((route) => route.name === name)).filter(
    (route) => route !== undefined,
  );
  const currentName = state.routes[state.index]?.name;

  return (
    <Animated.View accessibilityRole="tablist" style={[styles.bar, animatedStyle]}>
      <View style={[styles.row, { paddingBottom: insets.bottom }]}>
        {routes.map((route) => {
          const name = route.name as keyof typeof skin.copy.tabs;
          const label = skin.copy.tabs[name];
          if (!label || (name === "admin" && user?.type !== "admin")) return null;
          const isCurrent = currentName === route.name;
          const badge = name === "swipe" && pending && !isCurrent;
          const Icon = ICONS[name] ?? SunIcon;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={badge ? T.tabWaiting(label) : label}
              accessibilityState={{ selected: isCurrent }}
              onPress={() => {
                const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (currentName !== route.name && !event.defaultPrevented) navigateToTab(route.key);
              }}
              style={styles.tab}
            >
              <View style={styles.iconWrap}>
                <Icon size={skin.size.icon.action + 2} color={isCurrent ? C.ink : C.soft} strokeWidth={isCurrent ? 1.8 : 1.4} />
                {badge && (
                  <View style={styles.badge}>
                    <Dot color={C.pending} size={7} />
                  </View>
                )}
              </View>
              <Dot color={isCurrent ? C.ink : "transparent"} size={4} />
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    bar: {
      backgroundColor: C.ground,
      borderTopColor: C.hairline,
      borderTopWidth: s.shape.divider,
      overflow: "hidden",
    },
    row: { flex: 1, flexDirection: "row", paddingHorizontal: s.spacing.tight },
    tab: { alignItems: "center", flex: 1, gap: s.spacing.tight + 2, justifyContent: "center" },
    iconWrap: { alignItems: "center", justifyContent: "center" },
    badge: { position: "absolute", right: -s.spacing.tight, top: -s.spacing.hair },
  });

export default CalmTabBar;
