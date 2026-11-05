import type { Skin } from "@/skins/types";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { Pressable, StyleSheet } from "react-native";

const ActionRow = ({
  label,
  onPress,
  destructive = false,
  showChevron = false,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const ink = destructive ? skin.colors.danger : skin.colors.onPaper;

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
              borderTopColor: skin.colors.onPaper,
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
