import ActionPanel, { ActionPanelRequest } from "@/components/elements/ActionPanel";
import AnimatedListItem from "@/components/elements/AnimatedListItem";
import BottomActionBar from "@/components/elements/BottomActionBar";
import EmptyData from "@/components/elements/EmptyData";
import KilButton from "@/components/elements/KilButton";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import useFoodList from "@/providers/FoodListProvider";
import { FoodType } from "@/types/model";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import Animated from "react-native-reanimated";
import FoodFormModal from "./_components/FoodFormModal";
import FoodRow from "./_components/FoodRow";

const FoodList = () => {
  const theme = useTheme();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodType | null>(null);
  const [actionRequest, setActionRequest] = useState<ActionPanelRequest | null>(
    null,
  );

  const {
    foods,
    isFoodLoading,
    mutateFood,
    search,
    setSearch,
    createFood,
    editFood,
    removeFoodsFromList,
  } = useFoodList();

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

  const closeActionPanel = useCallback(() => setActionRequest(null), []);
  const closeAddModal = useCallback(() => setIsAddModalVisible(false), []);
  const closeEditModal = useCallback(() => setEditingFood(null), []);

  const handleEdit = (food: FoodType) => {
    setIsAddModalVisible(false);
    setEditingFood(food);
  };

  const handleDeleteOne = (food: FoodType) => {
    setActionRequest({
      title: "Remove from list",
      message: `Remove "${food.name}" from this list?`,
      actions: [
        {
          label: "Remove",
          destructive: true,
          onPress: () => removeFoodsFromList([food.id]),
        },
      ],
    });
  };

  const handleOpenRowMenu = (food: FoodType) => {
    setActionRequest({
      title: food.name,
      actions: [
        { label: "Edit", onPress: () => handleEdit(food) },
        {
          label: "Delete",
          destructive: true,
          onPress: () => handleDeleteOne(food),
        },
      ],
    });
  };

  const handleOpenListMenu = () => {
    setActionRequest({
      actions: [
        {
          label: "Add item",
          onPress: () => {
            setEditingFood(null);
            setIsAddModalVisible(true);
          },
        },
        { label: "Select items", onPress: () => setIsSelectMode(true) },
      ],
    });
  };

  const handleDeleteSelected = () => {
    setActionRequest({
      title: "Remove from list",
      message: `Remove ${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""} from this list?`,
      actions: [
        {
          label: "Remove",
          destructive: true,
          onPress: async () => {
            await removeFoodsFromList(selectedIds);
            exitSelectMode();
          },
        },
      ],
    });
  };

  if (isFoodLoading && foods === undefined) {
    return <LoadingAnim centered />;
  }

  const renderItem = ({ item }: { item: FoodType }) => {
    return (
      <AnimatedListItem key={item.id}>
        <FoodRow
          food={item}
          isSelectMode={isSelectMode}
          isSelected={selectedIds.includes(item.id)}
          onToggleSelect={toggleSelect}
          onOpenMenu={handleOpenRowMenu}
        />
      </AnimatedListItem>
    );
  };

  const emptyListComponent = () => (
    <EmptyData
      label="No foods available"
      onRefresh={mutateFood}
      pullToRefresh={false}
    />
  );

  return (
    <KeyboardAvoidingView
      style={[styles.listContainer, { backgroundColor: theme.background }]}
      behavior="height"
    >
      <View style={styles.content}>
        <Animated.FlatList
          data={foods}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={emptyListComponent}
          onRefresh={mutateFood}
          refreshing={isFoodLoading}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 80,
          }}
        />

        {isSelectMode ? (
          <ThemedView
            style={[
              styles.selectBar,
              {
                backgroundColor: theme.backgroundElement,
                bottom: Spacing.three,
              },
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
            onOpenMenu={handleOpenListMenu}
          />
        )}

      </View>

      <ActionPanel request={actionRequest} onClose={closeActionPanel} />

      <FoodFormModal
        visible={isAddModalVisible}
        title="Add item"
        onSubmit={createFood}
        onClose={closeAddModal}
      />

      <FoodFormModal
        visible={editingFood !== null}
        formKey={editingFood?.id}
        title="Edit item"
        initialName={editingFood?.name}
        initialDescription={editingFood?.description}
        onSubmit={async (data) => {
          if (!editingFood) return false;
          return editFood(editingFood.id, data);
        }}
        onClose={closeEditModal}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    paddingTop: Spacing.six,
  },
  content: {
    flex: 1,
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
