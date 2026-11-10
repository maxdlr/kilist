import type { Skin } from "@/skins/types";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { Pressable, StyleSheet, View } from "react-native";

const ActionRow = ({
  label,
  detail,
  onPress,
  destructive = false,
  showChevron = false,
  onPanel = false,
}: {
  label: string;
  detail?: string;
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
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      style={({ pressed }) => [
        styles.row,
        destructive
          ? { backgroundColor: skin.colors.ground }
          : {
              borderTopColor: surfaceInk,
              borderTopWidth: skin.shape.border + 1,
            },
        detail ? styles.tall : null,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.label}>
        <ThemedText size={skin.type.lead} color={ink} numberOfLines={1}>
          {label}
        </ThemedText>
        {detail ? (
          <ThemedText size={skin.type.caption} color={ink} numberOfLines={1}>
            {detail}
          </ThemedText>
        ) : null}
      </View>
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
      minWidth: 0,
    },
    tall: {
      height: undefined,
      minHeight: s.size.row.list,
      paddingVertical: s.spacing.small,
    },
    pressed: {
      opacity: s.shape.pressedOpacity,
    },
  });

export default ActionRow;
