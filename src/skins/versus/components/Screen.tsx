import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { versusPalette as P } from "../theme/palette";

export const Screen = ({
  children,
  dock,
  scroll = false,
  padded = true,
}: {
  children: ReactNode;
  dock?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  useStatusBarStyle(skin.statusBarOnGround);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.content,
          padded && styles.padded,
          { paddingTop: insets.top + skin.spacing.top },
          scroll && styles.noGap,
        ]}
      >
        {children}
      </View>
      {dock && <View style={styles.dock}>{dock}</View>}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: { backgroundColor: P.ground, flex: 1 },
    content: { flex: 1, gap: s.spacing.stack, minHeight: 0 },
    padded: { paddingHorizontal: s.spacing.gutter },
    noGap: { gap: 0 },
    dock: {
      gap: s.spacing.small,
      paddingBottom: 0,
      paddingHorizontal: s.spacing.gutter,
      paddingTop: s.spacing.section,
    },
  });
