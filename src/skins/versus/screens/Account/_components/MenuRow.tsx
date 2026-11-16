import Press from "@/components/elements/Press";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet } from "react-native";
import { versusPalette as P } from "@/skins/versus/theme/palette";
import { VText } from "@/skins/versus/components";

const MenuRow = ({ label, detail, onPress, first = false }: { label: string; detail?: string; onPress: () => void; first?: boolean }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, !first && styles.menuBorder, pressed && { backgroundColor: P.panelHigh }]}
    >
      <VText size={skin.type.body}>{label}</VText>
      <VText size={skin.type.label} color={P.muted}>{detail ?? "›"}</VText>
    </Press>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    menuRow: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      minHeight: s.size.button.md,
      paddingHorizontal: s.spacing.stack,
    },
    menuBorder: { borderTopColor: P.line, borderTopWidth: s.shape.divider },
  });

export default MenuRow;
