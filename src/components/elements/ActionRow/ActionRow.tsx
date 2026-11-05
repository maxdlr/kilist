import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet } from "react-native";
import { ChevronRightIcon } from "react-native-heroicons/solid";

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
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: theme.backgroundSelected },
        pressed && { backgroundColor: theme.backgroundElement },
      ]}
    >
      <ThemedText style={destructive && { color: theme.cancel[50] }}>
        {label}
      </ThemedText>
      {showChevron && (
        <ChevronRightIcon size={18} color={theme.textSecondary} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

export default ActionRow;
