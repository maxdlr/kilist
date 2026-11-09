import type { Skin } from "@/skins/types";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
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

  return (
    <View
      style={[
        styles.dock,
        { backgroundColor: skin.colors.ground },
        row && styles.row,
        style,
        !insideTabs && !overKeyboard && {
          paddingBottom:
            (StyleSheet.flatten(style)?.paddingBottom as number | undefined ?? skin.spacing.dock) + insets.bottom,
        },
      ]}
    >
      {children}
    </View>
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
