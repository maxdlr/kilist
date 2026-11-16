import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import type { Skin } from "@/skins/types";
import { type ComponentRef, ReactNode, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calmColors } from "../theme/useCalmColors";
import { GlassBackdrop, GlassScene, useTabBarInset } from "./Glass";
import { createButtonStyles } from "./styles";

/** Empty space between the tab bar's top edge and its icons; mirrors the CalmTabBar tab layout. */
const tabBarHeadroom = (s: Skin) => {
  const icon = s.size.icon.action + 2;
  const label = Math.round((s.type.caption - 1) * 1.38);
  return (s.size.tabBar - (icon + s.spacing.tight + label)) / 2;
};

export const Screen = ({
  children,
  dock,
  padded = true,
  glass = false,
  cover,
}: {
  children: ReactNode;
  dock?: ReactNode;
  padded?: boolean;
  /** Content scrolls under the dock and tab bar, which blur it. Scroll content goes in a GlassScrollView (or ends with a DockSpacer). */
  glass?: boolean;
  cover?: SharedValue<number>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { insideTabs } = useTabBarVisibility();
  const target = useRef<ComponentRef<typeof View>>(null);
  const [dockHeight, setDockHeight] = useState(0);
  const tabBar = useTabBarInset();
  const dockLift = useAnimatedStyle(() => ({ bottom: tabBar.offset.value }));
  const tabBarRoom = useAnimatedStyle(() => ({ paddingBottom: tabBar.offset.value }));
  useStatusBarStyle(skin.statusBarOnGround);

  const content = [
    styles.content,
    padded && styles.padded,
    { paddingTop: insets.top + skin.spacing.page - skin.spacing.small },
  ];
  const dockRow = [
    styles.actionRow,
    styles.dock,
    !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom },
    // Sitting on the tab bar: match the gap above the buttons, counting the bar's own headroom.
    tabBar.inset > 0 && { paddingBottom: Math.max(0, skin.spacing.stack - tabBarHeadroom(skin)) },
  ];

  if (glass) {
    return (
      <View style={styles.root}>
        <GlassScene target={target} extraInset={dock ? dockHeight : 0}>
          <View style={[content, !dock && !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom }]}>
            {children}
          </View>
        </GlassScene>
        {dock && (
          <Animated.View
            style={[styles.glassDock, dockLift]}
            onLayout={(event) => setDockHeight(event.nativeEvent.layout.height)}
          >
            <GlassBackdrop target={target} cover={cover} />
            <View style={[dockRow, styles.glassRow]}>{dock}</View>
          </Animated.View>
        )}
      </View>
    );
  }

  // Content stops above the tab bar, but the scene is still what the bar's glass blurs, so it looks the same everywhere.
  return (
    <GlassScene target={target}>
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
