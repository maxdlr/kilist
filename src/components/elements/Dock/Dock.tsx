import type { Skin } from "@/skins/types";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTabBarVisibility } from "@/providers/TabBarProvider";

const Dock = ({
  children,
  row = false,
  overKeyboard = false,
  style,
}: {
  children: ReactNode;
  row?: boolean;
  overKeyboard?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { insideTabs } = useTabBarVisibility();
  const { progress } = useReanimatedKeyboardAnimation();
  const pad = (StyleSheet.flatten(style)?.paddingBottom as number | undefined) ?? skin.spacing.dock;
  const safeArea = insideTabs ? 0 : insets.bottom;
  const bottom = useAnimatedStyle(() => ({
    paddingBottom: pad + safeArea * (overKeyboard ? 1 - progress.value : 1),
  }));

  return (
    <Animated.View
      style={[styles.dock, { backgroundColor: skin.colors.ground }, row && styles.row, style, !insideTabs && bottom]}
    >
      {children}
    </Animated.View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    dock: {
      gap: s.spacing.inline,
      padding: s.spacing.dock,
    },
    row: {
      flexDirection: "row",
    },
  });

export default Dock;
