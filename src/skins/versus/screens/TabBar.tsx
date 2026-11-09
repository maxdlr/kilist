import { A } from "@/admin/ui";
import { tabAria } from "@/components/elements/TabBar/RoastTabBar";
import type { TabBarProps } from "@/components/elements/TabBar/types";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { ComponentType, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  HomeIcon,
  ListBulletIcon,
  ShoppingBagIcon,
  UserIcon,
  WrenchIcon,
} from "react-native-heroicons/outline";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { versusPalette as P } from "..";
import { VText } from "./parts";

const ORDER = ["index", "inventory", "swipe", "shop", "account", "admin"];

const ICONS: Record<string, ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  index: HomeIcon,
  inventory: ListBulletIcon,
  shop: ShoppingBagIcon,
  account: UserIcon,
  admin: WrenchIcon,
};

const VersusTabBar = ({ state, emitter, navigateToTab }: TabBarProps) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { isHidden } = useTabBarVisibility();
  const fullHeight = skin.size.tabBar + insets.bottom + skin.spacing.section;
  const height = useSharedValue(fullHeight);

  useEffect(() => {
    height.set(withTiming(isHidden ? 0 : fullHeight, AnimationService.config));
  }, [isHidden, fullHeight, height]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));
  const onAdmin = state.routes[state.index]?.name === "admin";
  const routes = ORDER.map((name) => state.routes.find((route) => route.name === name)).filter(
    (route) => route !== undefined,
  );

  return (
    <Animated.View accessibilityRole="tablist" style={[styles.wrap, onAdmin && { backgroundColor: A.ground }, animatedStyle]}>
      <View style={[styles.bar, { paddingBottom: insets.bottom + skin.spacing.small }]}>
        {routes.map((route) => {
          const name = route.name as keyof typeof skin.copy.tabs;
          const label = skin.copy.tabs[name];
          if (!label || (name === "admin" && user?.type !== "admin")) return null;
          const isCurrent = state.routes[state.index]?.key === route.key;
          const isRace = name === "swipe";
          const Icon = ICONS[name];
          const ink = isCurrent ? P.white : P.faint;

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={tabAria(name)}
              accessibilityState={{ selected: isCurrent }}
              onPress={() => {
                const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (!isCurrent && !event.defaultPrevented) navigateToTab(route.key);
              }}
              style={styles.tab}
            >
              {isRace ? (
                <View style={[styles.coin, isCurrent && styles.coinOn]}>
                  <VText face="display" size={skin.type.title - 2} color={P.ink}>
                    VS
                  </VText>
                </View>
              ) : (
                Icon && <Icon size={skin.size.icon.action} color={ink} strokeWidth={2} />
              )}
              <VText face={isCurrent ? "bold" : "medium"} size={skin.type.caption - 1} color={ink} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {label}
              </VText>
              <View style={[styles.bar3, { backgroundColor: isCurrent && !isRace ? P.you : "transparent" }]} />
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: P.ground,
      overflow: "hidden",
    },
    bar: {
      alignItems: "flex-end",
      backgroundColor: P.bar,
      borderTopColor: P.line,
      borderTopWidth: s.shape.divider,
      flex: 1,
      flexDirection: "row",
      marginTop: s.spacing.section,
      paddingHorizontal: s.spacing.small,
    },
    tab: {
      alignItems: "center",
      flex: 1,
      gap: s.spacing.tight,
      justifyContent: "flex-end",
    },
    coin: {
      alignItems: "center",
      backgroundColor: P.action,
      borderColor: P.bar,
      borderRadius: s.size.button.lg,
      borderWidth: s.spacing.tight,
      height: s.size.button.lg - 2,
      justifyContent: "center",
      marginTop: -s.spacing.section + s.spacing.tight,
      width: s.size.button.lg - 2,
    },
    coinOn: {
      boxShadow: `0 0 0 3px ${P.you}`,
    },
    bar3: {
      borderRadius: 2,
      height: 3,
      width: s.spacing.section - 2,
    },
  });

export default VersusTabBar;
