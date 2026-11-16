import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import T from "../text";
import { MAIN_TABS, shownTab } from "@/components/elements/TabBar/tabs";
import type { TabBarProps } from "@/components/elements/TabBar/types";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { type GlassTarget, useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  CartIcon,
  CartSolidIcon,
  HomeIcon,
  HomeSolidIcon,
  type Icon,
  ListIcon,
  ListSolidIcon,
  PlayIcon,
  PlaySolidIcon,
  SettingsIcon,
  SettingsSolidIcon,
  WrenchIcon,
  WrenchSolidIcon,
} from "@/components/icons";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calmColors, useCalmColors } from "../theme/useCalmColors";
import { CText, Dot, GlassBackdrop } from "../components";
import useCheckPending from "../hooks/useCheckPending";

const ORDER = MAIN_TABS;

// Android binds a BlurView to its target once, so remount the backdrop whenever the target screen changes.
const targetKeys = new WeakMap<GlassTarget, number>();
let nextTargetKey = 0;
const targetKey = (target: GlassTarget) => {
  if (!targetKeys.has(target)) targetKeys.set(target, ++nextTargetKey);
  return targetKeys.get(target);
};

/** Outline when idle, the same glyph solid when selected. */
const ICONS: Record<string, { idle: Icon; selected: Icon }> = {
  index: { idle: HomeIcon, selected: HomeSolidIcon },
  swipe: { idle: PlayIcon, selected: PlaySolidIcon },
  shop: { idle: CartIcon, selected: CartSolidIcon },
  inventory: { idle: ListIcon, selected: ListSolidIcon },
  account: { idle: SettingsIcon, selected: SettingsSolidIcon },
  admin: { idle: WrenchIcon, selected: WrenchSolidIcon },
};

const CalmTabBar = ({ state, emitter, navigateToTab }: TabBarProps) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { isHidden, glassTarget } = useTabBarVisibility();
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
  const actualName = state.routes[state.index]?.name;
  const currentName = shownTab(actualName);

  return (
    <Animated.View
      accessibilityRole="tablist"
      style={[styles.bar, !glassTarget && styles.solid, animatedStyle]}
    >
      {glassTarget && <GlassBackdrop key={targetKey(glassTarget)} target={glassTarget} />}
      <View style={[styles.row, { paddingBottom: insets.bottom }]}>
        {routes.map((route) => {
          const name = route.name as keyof typeof skin.copy.tabs;
          const label = skin.copy.tabs[name];
          if (!label) return null;
          const isCurrent = currentName === route.name;
          const badge = name === "swipe" && pending && !isCurrent;
          const icons = ICONS[name] ?? ICONS.index!;
          const TabIcon = isCurrent ? icons.selected : icons.idle;

          return (
            <Press
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={badge ? T.tabWaiting(label) : label}
              accessibilityState={{ selected: isCurrent }}
              onPress={() => {
                const event = emitter.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
                if (actualName !== route.name && !event.defaultPrevented) navigateToTab(route.key);
              }}
              style={withPressed(styles.tab)}
            >
              <View style={styles.iconWrap}>
                <TabIcon size={skin.size.icon.action + 2} color={isCurrent ? C.text : C.textSoft} strokeWidth={1.4} />
                {badge && (
                  <View style={styles.badge}>
                    <Dot color={C.pendingDot} size={7} />
                  </View>
                )}
              </View>
              <CText
                allowFontScaling={false}
                weight={isCurrent ? "semibold" : "regular"}
                size={skin.type.caption - 1}
                color={isCurrent ? C.text : C.textSoft}
                numberOfLines={1}
              >
                {label}
              </CText>
            </Press>
          );
        })}
      </View>
    </Animated.View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    bar: {
      bottom: 0,
      left: 0,
      overflow: "hidden",
      position: "absolute",
      right: 0,
    },
    solid: { backgroundColor: C.ground },
    row: { flex: 1, flexDirection: "row", paddingHorizontal: s.spacing.tight },
    tab: { alignItems: "center", flex: 1, gap: s.spacing.tight, justifyContent: "center" },
    iconWrap: { alignItems: "center", justifyContent: "center" },
    badge: { position: "absolute", right: -s.spacing.tight, top: -s.spacing.hair },
  });

export default CalmTabBar;
