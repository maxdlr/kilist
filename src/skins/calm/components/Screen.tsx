import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useDockHeight, useDockHosted, useDockStore } from "@/providers/DockStore";
import { useIsPreview } from "@/providers/PreviewProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import type { Skin } from "@/skins/types";
import { type ComponentRef, ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calmColors } from "../theme/useCalmColors";
import { dockGlassHeight, dockRowPadding } from "./DockHost";
import { DEFAULT_GLASS, GlassBackdrop, type GlassLook, GlassScene, useTabBarInset } from "./Glass";
import { createButtonStyles } from "./styles";

export const Screen = ({
  children,
  dock,
  dockMode = "default",
  dockDepth = 0,
  padded = true,
  glass = false,
  glassLook = DEFAULT_GLASS,
}: {
  children: ReactNode;
  dock?: ReactNode;
  dockMode?: string;
  dockDepth?: number;
  padded?: boolean;
  glass?: boolean;
  glassLook?: GlassLook;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { insideTabs, setGlassDockHeight, setGlassLook } = useTabBarVisibility();
  const target = useRef<ComponentRef<typeof View>>(null);
  const [dockHeight, setDockHeight] = useState(0);
  const tabBar = useTabBarInset();
  const dockLift = useAnimatedStyle(() => ({ bottom: tabBar.offset.value }));
  const store = useDockStore();
  const preview = useIsPreview();
  const hosted = useDockHosted(store) && insideTabs && !preview && store !== null;
  const hostHeight = useDockHeight(hosted ? store : null);
  const owner = useId();
  const [focused, setFocused] = useState(false);
  const tabBarRoom = useAnimatedStyle(() => ({ paddingBottom: tabBar.offset.value + (dock ? hostHeight : 0) }));
  const tabbed = insideTabs && tabBar.inset > 0;
  const hasGlassDock = Boolean(dock) || tabbed;
  const docked = glass && hasGlassDock && insideTabs;
  const rowHeight = dock ? dockHeight : 0;
  const glassHeight = hosted
    ? hostHeight
    : Math.max(rowHeight, tabbed ? (glassLook.height ?? dockGlassHeight(skin)) : 0);
  useStatusBarStyle(skin.statusBarOnGround);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (!docked) return;
      setGlassLook(glassLook);
      if (!hosted) setGlassDockHeight(glassHeight);
      return () => {
        if (!hosted) setGlassDockHeight(0);
        setGlassLook(null);
      };
    }, [docked, hosted, glassHeight, setGlassDockHeight, glassLook, setGlassLook]),
  );

  useEffect(() => {
    if (!hosted || !store) return;
    if (focused && (dock || glass)) store.show({ owner, mode: dockMode, depth: dockDepth, node: dock ?? null, glass });
    else store.clear(owner);
  });

  useEffect(() => () => store?.clear(owner), [store, owner]);

  const content = [
    styles.content,
    padded && styles.padded,
    { paddingTop: insets.top + skin.spacing.page - skin.spacing.small },
  ];
  const dockRow = [
    styles.actionRow,
    styles.dock,
    !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom },
    tabBar.inset > 0 && { paddingBottom: dockRowPadding(skin, true) },
  ];

  if (glass) {
    return (
      <View style={styles.root}>
        <GlassScene target={target} extraInset={hasGlassDock ? glassHeight : 0} look={glassLook}>
          <View style={[content, !dock && !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom }]}>
            {children}
          </View>
        </GlassScene>
        {hasGlassDock && !hosted && (
          <Animated.View pointerEvents="box-none" style={[styles.glassDock, dockLift]}>
            <View pointerEvents="none" style={[styles.glassLayer, { height: glassHeight }]}>
              <GlassBackdrop target={target} look={glassLook} />
            </View>
            {dock && (
              <View
                style={[dockRow, styles.glassRow]}
                onLayout={(event) => setDockHeight(event.nativeEvent.layout.height)}
              >
                {dock}
              </View>
            )}
          </Animated.View>
        )}
      </View>
    );
  }

  return (
    <GlassScene target={target} fade={false}>
      <Animated.View style={[styles.root, tabBarRoom]}>
        <View
          style={[
            content,
            !dock && !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom },
          ]}
        >
          {children}
        </View>
        {dock && !hosted && <View style={dockRow}>{dock}</View>}
      </Animated.View>
    </GlassScene>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    actionRow: createButtonStyles(s).actionRow,
    root: { backgroundColor: C.ground, flex: 1 },
    content: { flex: 1, gap: s.spacing.section + 4, minHeight: 0 },
    padded: { paddingHorizontal: s.spacing.gutter },
    dock: { paddingBottom: s.spacing.gutter, paddingHorizontal: s.spacing.gutter },
    glassDock: { bottom: 0, left: 0, position: "absolute", right: 0 },
    glassLayer: { bottom: 0, left: 0, overflow: "hidden", position: "absolute", right: 0 },
    glassRow: { paddingTop: s.spacing.stack },
  });
