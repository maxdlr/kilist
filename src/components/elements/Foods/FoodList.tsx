import { DimensionValue, ScrollView, StyleSheet } from "react-native";
import FoodRow from "./_components/FoodRow";
import { useTheme } from "expo-router";
import useFoodList from "@/providers/FoodListProvider";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

const FoodList = () => {
  const theme = useTheme();
  const { foods, isFoodLoading } = useFoodList();

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
      {foods?.map((food, i) => (
        <FoodRow
          food={food}
          key={food.id}
          style={{
            backgroundColor:
              i % 2 === 0 ? theme.colors.card : theme.colors.background,
          }}
        />
      ))}
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
  item: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
  },
});

export default FoodList;
