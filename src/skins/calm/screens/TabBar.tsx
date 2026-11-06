import { TAB_ARIA } from "@/components/elements/TabBar/RoastTabBar";
import type { TabBarProps } from "@/components/elements/TabBar/types";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calmPalette as C } from "..";
import { CText, Dot, useCheckPending } from "./parts";

const ORDER = ["index", "swipe", "list", "account", "admin"];

const CalmTabBar = ({ state, navigation }: TabBarProps) => {
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
          const isCurrent = currentName === route.name || (currentName === "shop" && name === "index");
          const badge = name === "swipe" && pending && !isCurrent;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={badge ? `${TAB_ARIA[name]}, a check is waiting` : TAB_ARIA[name]}
              accessibilityState={{ selected: isCurrent }}
              onPress={() => {
                const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (currentName !== route.name && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={styles.tab}
            >
              <View style={styles.labelRow}>
                <CText weight={isCurrent ? "semibold" : "regular"} size={skin.type.body - 1} color={isCurrent ? C.ink : C.soft}>
                  {label}
                </CText>
                {badge && <Dot color={C.pending} size={6} />}
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
    row: { flex: 1, flexDirection: "row", paddingHorizontal: s.spacing.inline },
    tab: { alignItems: "center", flex: 1, gap: s.spacing.tight + 2, justifyContent: "center" },
    labelRow: { alignItems: "center", flexDirection: "row", gap: s.spacing.tight + 2 },
  });

export default CalmTabBar;
