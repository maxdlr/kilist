import { DimensionValue, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "expo-router";
import useFoodList from "@/providers/FoodListProvider";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import ShopFoodRow from "./_components/ShopFoodRow";

const ShopList = () => {
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
            <ShopFoodRow food={food} key={food.id} onBuy={buyFood} />
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

export default ShopList;
