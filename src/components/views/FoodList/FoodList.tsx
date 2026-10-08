import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import useFoodList from "@/providers/FoodListProvider";
import { StyleSheet } from "react-native";
import FoodRow from "./_components/FoodRow";

const FoodList = () => {
  const { foods, isFoodLoading } = useFoodList();

  if (isFoodLoading) {
    return (
      <ThemedView>
        <ThemedText>loading</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ ...styles.listContainer }}>
      <>
        {foods
          ?.filter((f) => f.inStockScore < 1)
          ?.map((food) => (
            <FoodRow food={food} key={food.id} />
          ))}
      </>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingTop: Spacing.six,
  },
});

export default FoodList;
