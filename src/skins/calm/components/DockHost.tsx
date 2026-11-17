import { type DockEntry, useDockCovered, useDockStore, useDockTop } from "@/providers/DockStore";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calmColors } from "../theme/useCalmColors";
import { DEFAULT_GLASS, GlassBackdrop, glassTargetKey } from "./Glass";
import { createButtonStyles } from "./styles";

const SLIDE = 56;
const SWITCH = { duration: AnimationService.config.duration, easing: AnimationService.easeOut };

const tabBarHeadroom = (s: Skin) => {
  const icon = s.size.icon.action + 2;
  const label = Math.round((s.type.caption - 1) * 1.38);
  return (s.size.tabBar - (icon + s.spacing.tight + label)) / 2;
};

export const dockGlassHeight = (s: Skin) =>
  s.spacing.stack + s.size.button.md + Math.max(0, s.spacing.stack - tabBarHeadroom(s));

export const dockRowPadding = (s: Skin, tabbed: boolean) =>
  tabbed ? Math.max(0, s.spacing.stack - tabBarHeadroom(s)) : s.spacing.gutter;

const keyOf = (entry: DockEntry | null) => (entry ? `${entry.owner}:${entry.mode}` : "");

const directionOf = (from: DockEntry | null, to: DockEntry | null) => {
  if (!from || !to || from.owner !== to.owner) return 0;
  return to.depth >= from.depth ? 1 : -1;
};

const DockHost = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const store = useDockStore();
  const entry = useDockTop(store);
  const covered = useDockCovered(store);
  const shown = useSharedValue(covered ? 0 : 1);
  const reduced = useReducedMotion();
  const { isHidden, glassTarget, glassLook, setGlassDockHeight } = useTabBarVisibility();
  const keyboard = useReanimatedKeyboardAnimation();
  const direction = useSharedValue(0);
  const [rowHeight, setRowHeight] = useState(0);

  const tabbed = !isHidden;
  const look = glassLook ?? DEFAULT_GLASS;
  const glass = Boolean(entry?.glass && glassTarget);
  const fixed = tabbed ? (look.height ?? dockGlassHeight(skin)) : 0;
  const strip = entry?.glass ? Math.max(rowHeight, fixed) : entry?.node ? rowHeight : 0;
  const tabInset = tabbed ? skin.size.tabBar + insets.bottom : 0;
  const tabLift = useSharedValue(tabInset);
  const padTabbed = dockRowPadding(skin, tabbed);
  const padFree = dockRowPadding(skin, false);

  useEffect(() => store?.mountHost(), [store]);

  useEffect(() => {
    if (!store) return;
    let last = store.top();
    return store.subscribe(() => {
      const next = store.top();
      if (keyOf(next) !== keyOf(last)) direction.set(directionOf(last, next));
      last = next;
    });
  }, [store, direction]);

  useEffect(() => {
    tabLift.set(withTiming(tabInset, AnimationService.config));
  }, [tabInset, tabLift]);

  useEffect(() => {
    shown.set(withTiming(covered ? 0 : 1, AnimationService.config));
  }, [covered, shown]);

  useEffect(() => {
    store?.setHeight(strip);
    setGlassDockHeight(entry?.glass ? strip : 0);
  }, [store, strip, entry?.glass, setGlassDockHeight]);

  useEffect(() => () => setGlassDockHeight(0), [setGlassDockHeight]);

  const lift = useAnimatedStyle(() => ({
    bottom: Math.max(tabLift.value, Math.abs(keyboard.height.value)),
    opacity: shown.value,
  }));
  const stripStyle = useAnimatedStyle(() => ({
    height: interpolate(keyboard.progress.value, [0, 1], [strip, rowHeight]),
  }));
  const rowPad = useAnimatedStyle(() => ({
    paddingBottom: interpolate(keyboard.progress.value, [0, 1], [padTabbed, padFree]),
  }));

  const entering = () => {
    "worklet";
    const from = direction.value * -SLIDE;
    return {
      initialValues: { opacity: 0, transform: [{ translateY: from }] },
      animations: {
        opacity: withTiming(1, SWITCH),
        transform: [{ translateY: withTiming(0, SWITCH) }],
      },
    };
  };
  const exiting = () => {
    "worklet";
    const to = direction.value * SLIDE;
    return {
      initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
      animations: {
        opacity: withTiming(0, SWITCH),
        transform: [{ translateY: withTiming(to, SWITCH) }],
      },
    };
  };

  if (!entry) return null;

  return (
    <Animated.View pointerEvents={covered ? "none" : "box-none"} style={[styles.host, lift]}>
      {strip > 0 && (
        <Animated.View pointerEvents="none" style={[styles.strip, stripStyle, !glass && styles.solid]}>
          {glass && glassTarget && (
            <GlassBackdrop key={glassTargetKey(glassTarget)} target={glassTarget} look={look} />
          )}
        </Animated.View>
      )}
      <View style={styles.clip} onLayout={(event) => setRowHeight(event.nativeEvent.layout.height)}>
        {entry.node ? (
          <Animated.View
            key={keyOf(entry)}
            entering={reduced ? undefined : entering}
            exiting={reduced ? undefined : exiting}
            style={[styles.row, rowPad]}
          >
            {entry.node}
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    host: { left: 0, position: "absolute", right: 0 },
    strip: { bottom: 0, left: 0, overflow: "hidden", position: "absolute", right: 0 },
    solid: { backgroundColor: C.ground },
    clip: { overflow: "hidden" },
    row: {
      ...createButtonStyles(s).actionRow,
      paddingHorizontal: s.spacing.gutter,
      paddingTop: s.spacing.stack,
    },
  });

export default DockHost;
