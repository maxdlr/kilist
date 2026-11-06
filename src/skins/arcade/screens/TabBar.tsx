import { TAB_ARIA } from "@/components/elements/TabBar/RoastTabBar";
import type { TabBarProps } from "@/components/elements/TabBar/types";
import { ThemedText } from "@/components/themed-text";
import useAuth from "@/providers/AuthProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { ComponentType, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  HomeIcon,
  PlayIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  UserCircleIcon,
  WrenchIcon,
} from "react-native-heroicons/outline";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { arcadePalette as P } from "..";
import { shadowOf } from "./parts";

const ORDER = ["index", "list", "swipe", "shop", "account", "admin"];

const ICONS: Record<string, ComponentType<{ size: number; color: string; strokeWidth?: number }>> = {
  index: HomeIcon,
  list: Squares2X2Icon,
  swipe: PlayIcon,
  shop: ShoppingCartIcon,
  account: UserCircleIcon,
  admin: WrenchIcon,
};

const ArcadeTabBar = ({ state, navigation }: TabBarProps) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { user } = useAuth();
  const isAdmin = user?.type === "admin";
  const insets = useSafeAreaInsets();
  const { isHidden } = useTabBarVisibility();
  const raise = skin.spacing.section;
  const fullHeight = skin.size.tabBar + insets.bottom + raise;
  const height = useSharedValue(fullHeight);

  useEffect(() => {
    height.set(withTiming(isHidden ? 0 : fullHeight, AnimationService.config));
  }, [isHidden, fullHeight, height]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  const routes = ORDER.map((name) =>
    state.routes.find((route) => route.name === name),
  ).filter((route) => route !== undefined);

  return (
    <Animated.View
      accessibilityRole="tablist"
      style={[styles.wrap, animatedStyle]}
    >
      <View style={[styles.bar, { paddingBottom: insets.bottom, marginTop: raise }]}>
        {routes.map((route) => {
          const name = route.name as keyof typeof skin.copy.tabs;
          const label = skin.copy.tabs[name];
          if (!label || (name === "admin" && !isAdmin)) return null;
          const isCurrent = state.routes[state.index]?.key === route.key;
          const Icon = ICONS[name]!;
          const isPlay = name === "swipe";

          const press = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isCurrent && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={TAB_ARIA[name]}
              accessibilityState={{ selected: isCurrent }}
              onPress={press}
              style={styles.tab}
            >
              {isPlay ? (
                <View
                  style={[
                    styles.coin,
                    {
                      backgroundColor: P.yellow,
                      boxShadow: shadowOf(skin, isCurrent ? -3 : 0),
                      transform: [{ translateY: isCurrent ? 2 : 0 }],
                    },
                  ]}
                >
                  <PlayIcon size={skin.size.icon.action} color={P.navy} strokeWidth={2.4} />
                </View>
              ) : (
                <View
                  style={[
                    styles.pill,
                    isCurrent && { backgroundColor: P.pale, borderColor: P.navy },
                  ]}
                >
                  <Icon size={skin.size.icon.action - skin.spacing.small} color={P.navy} strokeWidth={2.2} />
                </View>
              )}
              <ThemedText
                allowFontScaling={false}
                size={skin.type.caption - 2}
                color={isCurrent ? P.navy : P.dimInk}
              >
                {label}
              </ThemedText>
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
      backgroundColor: s.colors.ground,
      overflow: "hidden",
    },
    bar: {
      alignItems: "flex-end",
      backgroundColor: P.white,
      borderColor: P.navy,
      borderTopLeftRadius: s.shape.radius + s.spacing.tight,
      borderTopRightRadius: s.shape.radius + s.spacing.tight,
      borderTopWidth: s.shape.border,
      flex: 1,
      flexDirection: "row",
      paddingHorizontal: s.spacing.small,
      paddingTop: s.spacing.small,
    },
    tab: {
      alignItems: "center",
      flex: 1,
      gap: s.spacing.hair,
      justifyContent: "flex-end",
      paddingBottom: s.spacing.tight,
    },
    pill: {
      alignItems: "center",
      borderColor: "transparent",
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border - 1,
      height: s.size.icon.action,
      justifyContent: "center",
      width: s.size.icon.action * 1.7,
    },
    coin: {
      alignItems: "center",
      borderColor: P.navy,
      borderRadius: s.size.button.lg,
      borderWidth: s.shape.border,
      height: s.size.button.lg,
      justifyContent: "center",
      marginTop: -s.spacing.section + s.spacing.hair,
      width: s.size.button.lg,
    },
  });

export default ArcadeTabBar;
