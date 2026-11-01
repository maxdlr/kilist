import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Alert, Pressable, StyleSheet, TextInput } from "react-native";
import { EllipsisVerticalIcon } from "react-native-heroicons/solid";

export type BottomActionBarMenuAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
};

const BottomActionBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  menuActions,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  menuActions: BottomActionBarMenuAction[];
}) => {
  const theme = useTheme();

  const openMenu = () => {
    Alert.alert(
      "",
      undefined,
      [
        ...menuActions.map((action) => ({
          text: action.label,
          style: action.destructive ? ("destructive" as const) : undefined,
          onPress: action.onPress,
        })),
        { text: "Cancel", style: "cancel" as const },
      ],
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: theme.backgroundElement, bottom: BottomTabInset },
      ]}
    >
      <TextInput
        value={searchValue}
        onChangeText={onSearchChange}
        placeholder={searchPlaceholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text }]}
      />

      <Pressable onPress={openMenu} style={styles.menuButton}>
        <EllipsisVerticalIcon size={24} color={theme.text} />
      </Pressable>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.one,
  },
  menuButton: {
    padding: Spacing.one,
  },
});

export default BottomActionBar;
