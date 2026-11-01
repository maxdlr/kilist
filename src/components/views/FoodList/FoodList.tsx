import BottomActionBar from "@/components/elements/BottomActionBar";
import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import useFoodList from "@/providers/FoodListProvider";
import { FoodType } from "@/types/model";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet } from "react-native";
import FoodFormModal from "./_components/FoodFormModal";
import FoodRow from "./_components/FoodRow";

const FoodList = () => {
  const { foods, isFoodLoading, mutateFood, search, setSearch, createFood, editFood, removeFoodsFromList } =
    useFoodList();
  const theme = useTheme();

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodType | null>(null);

  // Re-fetch every time this tab becomes focused (initial mount, tab switch,
  // or navigating back to it) so the list is never stale when the user sees it.
  useFocusEffect(
    useCallback(() => {
      mutateFood();
    }, [mutateFood]),
  );

  const toggleSelect = (foodId: number) => {
    setSelectedIds((prev) =>
      prev.includes(foodId)
        ? prev.filter((id) => id !== foodId)
        : [...prev, foodId],
    );
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds([]);
  };

  const handleDeleteOne = (food: FoodType) => {
    Alert.alert(
      "Remove from list",
      `Remove "${food.name}" from this list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeFoodsFromList([food.id]),
        },
      ],
    );
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      "Remove from list",
      `Remove ${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""} from this list?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeFoodsFromList(selectedIds);
            exitSelectMode();
          },
        },
      ],
    );
  };

  if (isFoodLoading) {
    return (
      <ThemedView>
        <ThemedText>loading</ThemedText>
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: FoodType }) => {
    return (
      <FoodRow
        food={item}
        key={item.id}
        isSelectMode={isSelectMode}
        isSelected={selectedIds.includes(item.id)}
        onToggleSelect={toggleSelect}
        onEdit={setEditingFood}
        onDelete={handleDeleteOne}
      />
    );
  };

  const emptyListComponent = () => {
    return (
      <ThemedView>
        <ThemedText>No foods available</ThemedText>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.listContainer}>
      <FlatList
        data={foods}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={emptyListComponent}
        onRefresh={mutateFood}
        refreshing={isFoodLoading}
        contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.seven }}
      />

      {isSelectMode ? (
        <ThemedView
          style={[
            styles.selectBar,
            { backgroundColor: theme.backgroundElement, bottom: BottomTabInset },
          ]}
        >
          <ThemedText type="small">{selectedIds.length} selected</ThemedText>
          <ThemedView style={styles.selectBarActions}>
            <KilButton label="Cancel" onTouch={exitSelectMode} />
            <KilButton
              label="Delete"
              onTouch={handleDeleteSelected}
              style={{ container: { backgroundColor: theme.cancel[50] } }}
            />
          </ThemedView>
        </ThemedView>
      ) : (
        <BottomActionBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search inventory"
          menuActions={[
            { label: "Add item", onPress: () => setIsAddModalVisible(true) },
            { label: "Select items", onPress: () => setIsSelectMode(true) },
          ]}
        />
      )}

      <FoodFormModal
        visible={isAddModalVisible}
        title="Add item"
        onSubmit={createFood}
        onClose={() => setIsAddModalVisible(false)}
      />

      <FoodFormModal
        visible={editingFood !== null}
        title="Edit item"
        initialName={editingFood?.name}
        initialDescription={editingFood?.description}
        onSubmit={(data) => editFood(editingFood!.id, data)}
        onClose={() => setEditingFood(null)}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    paddingTop: Spacing.six,
  },
  selectBar: {
    position: "absolute",
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  selectBarActions: {
    flexDirection: "row",
    gap: Spacing.two,
  },
});

export default FoodList;
