import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import useFoodList from "@/providers/FoodListProvider";
import { FoodType } from "@/types/model";
import { useTheme } from "expo-router";
import {
  StyleProp,
  StyleSheet,
  StyleSheetProperties,
  ViewStyle,
} from "react-native";

const FoodRow = ({
  food,
  style,
}: {
  food: FoodType;
  style: StyleProp<ViewStyle>;
}) => {
  const { id, name, inStockScore } = food;
  const { foods } = useFoodList();

  const calculateValueFromInStockScore = (
    inStockScore: number,
    min = 50,
    max = 200,
  ) => {
    const highestInStockScore = Math.max(
      ...(foods?.map((i) => i.inStockScore) || [0]),
    );
    const lowestInStockScore = Math.min(
      ...(foods?.map((i) => i.inStockScore) || [1]),
    );

    if (highestInStockScore === lowestInStockScore) {
      return max;
    }

    return (
      min +
      (1 -
        (inStockScore - lowestInStockScore) /
          (highestInStockScore - lowestInStockScore)) *
        (max - min)
    );
  };

  return (
    <ThemedView
      key={id}
      style={{
        height: calculateValueFromInStockScore(inStockScore, 70, 200),
        minHeight: 70,
        ...style,
      }}
    >
      <ThemedText
        style={{
          ...styles.name,
          fontSize: calculateValueFromInStockScore(inStockScore, 18, 26),
        }}
      >
        {name}
      </ThemedText>
      <ThemedText>{Number((inStockScore * 100).toFixed(2))} %</ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
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

export default FoodRow;
