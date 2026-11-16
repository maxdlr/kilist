import Press from "@/components/elements/Press";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet } from "react-native";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components";

const Row = ({
  label,
  detail,
  onPress,
  color,
  chevron = true,
}: {
  label: string;
  detail?: string;
  onPress: () => void;
  color?: string;
  chevron?: boolean;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: C.tint }]}
    >
      <CText size={skin.type.body} color={color ?? C.text}>{label}</CText>
      <CText size={skin.type.label} color={C.textSoft} numberOfLines={1} style={styles.detail}>
        {`${detail ?? ""}${chevron ? (detail ? " ›" : "›") : ""}`}
      </CText>
    </Press>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    row: {
      alignItems: "center",
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      justifyContent: "space-between",
      minHeight: s.size.row.list - 4,
    },
    detail: { flexShrink: 1, textAlign: "right" },
  });

export default Row;
