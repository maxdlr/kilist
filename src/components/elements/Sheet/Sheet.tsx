import type { Skin } from "@/skins/types";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Sheet = ({
  children,
  fill,
  dock,
  style,
}: {
  children: ReactNode;
  fill?: string;
  dock?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const background = fill ?? skin.colors.ground;
  useStatusBarStyle(
    background === skin.colors.ground ? skin.statusBarOnGround : "dark",
  );

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <View style={[styles.content, { paddingTop: insets.top + skin.spacing.top }, style]}>
        {children}
      </View>
      {dock}
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
      justifyContent: "space-between",
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
  });

export default Sheet;
