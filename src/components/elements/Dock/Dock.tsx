import type { Skin } from "@/skins/types";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const Dock = ({
  children,
  row = false,
  style,
}: {
  children: ReactNode;
  row?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <View
      style={[
        styles.dock,
        { backgroundColor: skin.colors.ground },
        row && styles.row,
        style,
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
