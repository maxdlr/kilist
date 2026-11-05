import { ThemedView } from "@/components/themed-view";
import { Fonts, Spacing } from "@/constants/theme";
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
    Alert.alert("", undefined, [
      ...menuActions.map((action) => ({
        text: action.label,
        style: action.destructive ? ("destructive" as const) : undefined,
        onPress: action.onPress,
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: theme.backgroundElement, bottom: 1 },
      ]}
    >
      <TextInput
        value={searchValue}
        onChangeText={onSearchChange}
        placeholder={searchPlaceholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, fontFamily: Fonts.sans }]}
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
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    gap: Spacing.two,
    width: "100%",
    height: 80,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  menuButton: {
    padding: Spacing.one,
  },
});

export default BottomActionBar;
