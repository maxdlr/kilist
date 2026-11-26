import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { type DockTone, useDockHeight, useDockHosted, useDockStore } from "@/providers/DockStore";
import { useIsPreview } from "@/providers/PreviewProvider";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import type { Skin } from "@/skins/types";
import { ReactNode, useCallback, useEffect, useId, useState } from "react";
import { useFocusEffect } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { calmColors } from "../theme/useCalmColors";
import { dockRowPadding } from "./DockHost";
import { Scene, useTabBarInset } from "./Scene";
import { createButtonStyles } from "./styles";

export const screenTop = (s: Skin, inset: number) => inset + s.spacing.stack;

export const Screen = ({
  children,
  dock,
  dockMode = "default",
  dockDepth = 0,
  dockTone = "ground",
  padded = true,
  flushTop = false,
}: {
  children: ReactNode;
  dock?: ReactNode;
  dockMode?: string;
  dockDepth?: number;
  dockTone?: DockTone;
  padded?: boolean;
  flushTop?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { insideTabs } = useTabBarVisibility();
  const tabBar = useTabBarInset();
  const store = useDockStore();
  const preview = useIsPreview();
  const hosted = useDockHosted(store) && insideTabs && !preview && store !== null;
  const hostHeight = useDockHeight(hosted ? store : null);
  const owner = useId();
  const [focused, setFocused] = useState(false);
  const dockRoom = dock ? hostHeight : 0;
  const tabBarRoom = useAnimatedStyle(() => ({ paddingBottom: tabBar.offset.value + dockRoom }));
  useStatusBarStyle(skin.statusBarOnGround);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    if (!hosted || !store) return;
    if (focused && dock) store.show({ owner, mode: dockMode, depth: dockDepth, node: dock, tone: dockTone });
    else store.clear(owner);
  });

  useEffect(() => () => store?.clear(owner), [store, owner]);

  return (
    <Scene>
      <Animated.View style={[styles.root, tabBarRoom]}>
        <View
          style={[
            styles.content,
            padded && styles.padded,
            !flushTop && { paddingTop: screenTop(skin, insets.top) },
            !dock && !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom },
          ]}
        >
          {children}
        </View>
        {dock && !hosted && (
          <View
            style={[
              styles.actionRow,
              styles.dock,
              dockTone === "ink" && styles.ink,
              !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom },
              tabBar.inset > 0 && { paddingBottom: dockRowPadding(skin, true) },
            ]}
          >
            {dock}
          </View>
        )}
      </Animated.View>
    </Scene>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    actionRow: createButtonStyles(s).actionRow,
    root: { backgroundColor: C.ground, flex: 1 },
    content: { flex: 1, gap: s.spacing.section + 4, minHeight: 0 },
    padded: { paddingHorizontal: s.spacing.gutter },
    dock: { paddingBottom: s.spacing.gutter, paddingHorizontal: s.spacing.gutter, paddingTop: s.spacing.stack },
    ink: { backgroundColor: C.fill },
  });
