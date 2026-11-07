import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ReactNode } from "react";
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";

const DOT_GRID = 24;

export const Dots = () => (
  <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
    <Defs>
      <Pattern id="arcade-dots" width={DOT_GRID} height={DOT_GRID} patternUnits="userSpaceOnUse">
        <Circle cx={DOT_GRID / 2} cy={DOT_GRID / 2} r={2} fill="rgba(255,255,255,0.12)" />
      </Pattern>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#arcade-dots)" />
  </Svg>
);

const Ground = ({
  children,
  dock,
  padded = true,
  scroll = false,
  style,
}: {
  children: ReactNode;
  dock?: ReactNode;
  padded?: boolean;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  useStatusBarStyle(skin.statusBarOnGround);

  return (
    <View style={[styles.root, { backgroundColor: skin.colors.ground }]}>
      <Dots />
      {scroll ? (
        <ScrollView
          style={styles.scroller}
          contentContainerStyle={[
            styles.scrollContent,
            padded && styles.padded,
            { paddingTop: insets.top + skin.spacing.top },
            style,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.content,
            padded && styles.padded,
            { paddingTop: insets.top + skin.spacing.top },
            style,
          ]}
        >
          {children}
        </View>
      )}
      {dock && <View style={styles.dock}>{dock}</View>}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    content: {
      flex: 1,
      gap: s.spacing.section,
      minHeight: 0,
    },
    scroller: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      gap: s.spacing.section,
      paddingBottom: s.spacing.section,
    },
    padded: {
      paddingHorizontal: s.spacing.section,
    },
    dock: {
      gap: s.spacing.tight,
      paddingBottom: s.spacing.inline,
      paddingHorizontal: s.spacing.section,
      paddingTop: s.spacing.small,
    },
  });

export default Ground;
