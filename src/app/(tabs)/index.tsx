import KilButton from "@/components/elements/KilButton";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

const ListsScreen = () => {
  return (
    <ThemedView style={styles.container}>
      <KilButton label="Start Shopping" href="/shop" />
      <KilButton label="List" href="/list" />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.two,
  },
});

export default ListsScreen;
