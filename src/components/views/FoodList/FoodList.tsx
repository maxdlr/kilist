import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import useFoodList from "@/providers/FoodListProvider";
import { FoodType } from "@/types/model";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, StyleSheet } from "react-native";
import FoodRow from "./_components/FoodRow";

const FoodList = () => {
  const { foods, isFoodLoading, mutateFood } = useFoodList();

  // Re-fetch every time this tab becomes focused (initial mount, tab switch,
  // or navigating back to it) so the list is never stale when the user sees it.
  useFocusEffect(
    useCallback(() => {
      mutateFood();
    }, [mutateFood]),
  );

  if (isFoodLoading) {
    return (
      <ThemedView>
        <ThemedText>loading</ThemedText>
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: FoodType }) => {
    return <FoodRow food={item} key={item.id} />;
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
        // onViewableItemsChanged={handleScrollToTop}
        data={foods}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        // inverted
        // maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        ListEmptyComponent={emptyListComponent}
        onRefresh={mutateFood}
        refreshing={isFoodLoading}
        // onViewableItemsChanged
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
    paddingTop: Spacing.six,
  },
});

export default FoodList;
