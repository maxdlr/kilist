import type { Skin } from "@/skins/types";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { Pressable, StyleSheet } from "react-native";

const ActionRow = ({
  label,
  onPress,
  destructive = false,
  showChevron = false,
  onPanel = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  onPanel?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const surfaceInk = onPanel ? skin.panel.ink : skin.colors.onPaper;
  const ink = destructive ? skin.colors.danger : surfaceInk;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        destructive
          ? { backgroundColor: skin.colors.ground }
          : {
              borderTopColor: surfaceInk,
              borderTopWidth: skin.shape.border + 1,
            },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText size={skin.type.lead} color={ink} style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>
      {showChevron && (
        <ThemedText importantForAccessibility="no" size={skin.type.lead} color={ink}>
          {">"}
        </ThemedText>
      )}
    </Pressable>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
      height: s.size.row.list,
      justifyContent: "space-between",
      paddingHorizontal: s.spacing.gutter,
    },
    label: {
      flex: 1,
    },
    pressed: {
      opacity: s.shape.pressedOpacity,
    },
  });

export default ActionRow;
