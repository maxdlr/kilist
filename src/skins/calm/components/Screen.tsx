import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import type { Skin } from "@/skins/types";
import { type ComponentRef, ReactNode, useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calmColors } from "../theme/useCalmColors";
import { GlassBackdrop, GlassScene, useTabBarInset } from "./Glass";
import { createButtonStyles } from "./styles";

const tabBarHeadroom = (s: Skin) => {
  const icon = s.size.icon.action + 2;
  const label = Math.round((s.type.caption - 1) * 1.38);
  return (s.size.tabBar - (icon + s.spacing.tight + label)) / 2;
};

const dockGlassHeight = (s: Skin) =>
  s.spacing.stack + s.size.button.md + Math.max(0, s.spacing.stack - tabBarHeadroom(s));

export const Screen = ({
  children,
  dock,
  padded = true,
  glass = false,
}: {
  children: ReactNode;
  dock?: ReactNode;
  padded?: boolean;
  glass?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { insideTabs, setGlassDockHeight } = useTabBarVisibility();
  const target = useRef<ComponentRef<typeof View>>(null);
  const [dockHeight, setDockHeight] = useState(0);
  const tabBar = useTabBarInset();
  const dockLift = useAnimatedStyle(() => ({ bottom: tabBar.offset.value }));
  const tabBarRoom = useAnimatedStyle(() => ({ paddingBottom: tabBar.offset.value }));
  const tabbed = insideTabs && tabBar.inset > 0;
  const hasGlassDock = Boolean(dock) || tabbed;
  const docked = glass && hasGlassDock && insideTabs;
  useStatusBarStyle(skin.statusBarOnGround);

  useFocusEffect(
    useCallback(() => {
      if (!docked) return;
      setGlassDockHeight(dockHeight);
      return () => setGlassDockHeight(0);
    }, [docked, dockHeight, setGlassDockHeight]),
  );

  const content = [
    styles.content,
    padded && styles.padded,
    { paddingTop: insets.top + skin.spacing.page - skin.spacing.small },
  ];
  const dockRow = [
    styles.actionRow,
    styles.dock,
    !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom },
    tabBar.inset > 0 && { paddingBottom: Math.max(0, skin.spacing.stack - tabBarHeadroom(skin)) },
  ];

  if (glass) {
    return (
      <View style={styles.root}>
        <GlassScene target={target} extraInset={hasGlassDock ? dockHeight : 0}>
          <View style={[content, !dock && !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom }]}>
            {children}
          </View>
        </GlassScene>
        {hasGlassDock && (
          <Animated.View
            pointerEvents={dock ? "auto" : "none"}
            style={[styles.glassDock, tabbed && { minHeight: dockGlassHeight(skin) }, dockLift]}
            onLayout={(event) => setDockHeight(event.nativeEvent.layout.height)}
          >
            <GlassBackdrop target={target} />
            {dock && <View style={[dockRow, styles.glassRow]}>{dock}</View>}
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
        {dock && <View style={dockRow}>{dock}</View>}
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
    glassDock: { bottom: 0, left: 0, overflow: "hidden", position: "absolute", right: 0 },
    glassRow: { paddingTop: s.spacing.stack },
  });
