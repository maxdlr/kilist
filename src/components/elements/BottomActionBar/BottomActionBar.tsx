import { ThemedView } from "@/components/themed-view";
import { Fonts, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet, TextInput } from "react-native";
import { EllipsisVerticalIcon } from "react-native-heroicons/solid";

const BottomActionBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  onOpenMenu,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  onOpenMenu: () => void;
}) => {
  const theme = useTheme();

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

      <Pressable
        onPress={onOpenMenu}
        style={styles.menuButton}
        accessibilityRole="button"
        accessibilityLabel="Menu"
      >
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
