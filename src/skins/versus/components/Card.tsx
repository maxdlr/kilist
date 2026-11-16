import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { versusPalette as P } from "../theme/palette";

export const Card = ({
  children,
  style,
  line,
  dashed = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  line?: string;
  dashed?: boolean;
}) => {
  const styles = useSkinStyles(createStyles);
  const skin = useSkin();
  return (
    <View
      style={[
        styles.card,
        line && { borderColor: line, borderStyle: dashed ? "dashed" : "solid", borderWidth: skin.shape.border },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    card: {
      backgroundColor: P.panel,
      borderRadius: s.shape.radius + s.spacing.hair,
      gap: s.spacing.inline,
      padding: s.spacing.stack,
    },
  });
