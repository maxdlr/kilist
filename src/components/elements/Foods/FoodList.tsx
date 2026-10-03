import { DimensionValue, ScrollView, StyleSheet } from "react-native";
import FoodRow from "./_components/FoodRow";
import { useTheme } from "expo-router";
import useFoodList from "@/providers/FoodListProvider";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

const FoodList = () => {
  const theme = useTheme();
  const { foods, isFoodLoading, buyFood, suggestedFoodIds } = useFoodList();

  if (isFoodLoading) {
    return (
      <ThemedView>
        <ThemedText>loading</ThemedText>
      </ThemedView>
    );
  }

  const handleOnPress = async (currentFoodId: number) => {
    await buyFood(currentFoodId);
  };

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
            <FoodRow onPress={handleOnPress} food={food} key={food.id} />
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
