import { DimensionValue, ScrollView, StyleSheet } from "react-native";
import FoodRow from "./_components/FoodRow";
import { useTheme } from "expo-router";
import useFoodList from "@/providers/FoodListProvider";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

const FoodList = () => {
  const theme = useTheme();
  const { foods, isFoodLoading, suggestedFoodIds, buyFood } = useFoodList();

  if (isFoodLoading) {
    return (
      <ThemedView>
        <ThemedText>loading</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={
        (styles.listContainer, { backgroundColor: theme.colors.background })
      }
    >
      <>
        <ThemedText>
          {foods?.find((f) => f.id === suggestedFoodIds[0])?.name || "none"}
        </ThemedText>

        {foods
          ?.filter((f) => f.inStockScore < 1)
          ?.map((food) => (
            <FoodRow food={food} key={food.id} onBuy={buyFood} />
          ))}
      </>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    height: "auto" as DimensionValue,
  },
});

export default FoodList;
