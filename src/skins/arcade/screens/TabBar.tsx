import withPressed from "@/utils/withPressed";
import { A } from "@/admin/ui";
import { MAIN_TABS, shownTab } from "@/components/elements/TabBar/tabs";
import useRoundOpen from "@/hooks/useRoundOpen";
import { tabAria } from "@/components/elements/TabBar/RoastTabBar";
import type { TabBarProps } from "@/components/elements/TabBar/types";
import { ThemedText } from "@/components/themed-text";
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

const ORDER = MAIN_TABS;

const ICONS: Record<
  string,
  ComponentType<{ size: number; color: string; strokeWidth?: number }>
> = {
  index: HomeIcon,
  inventory: Squares2X2Icon,
  swipe: PlayIcon,
  shop: ShoppingCartIcon,
  account: UserCircleIcon,
  admin: WrenchIcon,
};

const ArcadeTabBar = ({ state, emitter, navigateToTab }: TabBarProps) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { pending } = useRoundOpen();
  const insets = useSafeAreaInsets();
  const { isHidden } = useTabBarVisibility();
  const raise =
    skin.spacing.stack +
    (state.routes[state.index]?.name === "account" ? skin.shape.shadow.offset : 0);
  const fullHeight = skin.size.tabBar + insets.bottom + raise;

  const height = useSharedValue(fullHeight);

  useEffect(() => {
    height.set(withTiming(isHidden ? 0 : fullHeight, AnimationService.config));
  }, [isHidden, fullHeight, height]);

  const animatedStyle = useAnimatedStyle(() => ({ height: height.value }));

  const onAdmin = state.routes[state.index]?.name === "admin";
  const routes = ORDER.map((name) =>
    state.routes.find((route) => route.name === name),
  ).filter((route) => route !== undefined);

  return (
    <Animated.View
      accessibilityRole="tablist"
      style={[
        styles.wrap,
        onAdmin && { backgroundColor: A.ground },
        animatedStyle,
      ]}
    >
      <View
        style={[styles.bar, { paddingBottom: insets.bottom, marginTop: raise }]}
      >
        {routes.map((route) => {
          const name = route.name as keyof typeof skin.copy.tabs;
          const label = skin.copy.tabs[name];
          if (!label) return null;
          const isActual = state.routes[state.index]?.key === route.key;
          const isCurrent = shownTab(state.routes[state.index]?.name) === route.name;
          const Icon = ICONS[name]!;
          const isPlay = name === "swipe";

          const press = () => {
            const event = emitter.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isActual && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={tabAria(name)}
              accessibilityState={{ selected: isCurrent }}
              onPress={press}
              style={withPressed(styles.tab)}
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
                  <PlayIcon
                    size={skin.size.icon.action}
                    color={P.navy}
                    strokeWidth={2.4}
                  />
                  {pending && !isCurrent && <View style={styles.badge} />}
                </View>
              ) : (
                <View
                  style={[
                    styles.pill,
                    isCurrent && {
                      backgroundColor: P.pale,
                      borderColor: P.navy,
                    },
                  ]}
                >
                  <Icon
                    size={skin.size.icon.action - skin.spacing.small}
                    color={P.navy}
                    strokeWidth={2.2}
                  />
                </View>
              )}
              <ThemedText
                allowFontScaling={false}
                size={skin.type.caption - 2}
                color={isCurrent ? P.navy : P.dimInk}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
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
    badge: {
      backgroundColor: P.mint,
      borderColor: P.navy,
      borderRadius: s.spacing.small,
      borderWidth: 2,
      height: s.spacing.stack - 2,
      position: "absolute",
      right: -s.spacing.tight,
      top: -s.spacing.tight,
      width: s.spacing.stack - 2,
    },
    coin: {
      alignItems: "center",
      borderColor: P.navy,
      borderRadius: s.size.button.lg,
      borderWidth: s.shape.border,
      height: s.size.button.lg,
      justifyContent: "center",
      marginBottom: s.shape.shadow.offset,
      marginTop: -s.spacing.section + s.spacing.hair,
      width: s.size.button.lg,
    },
  });

export default ArcadeTabBar;
