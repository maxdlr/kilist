import { ThemedText } from "@/components/themed-text";
import useFoodList from "@/providers/FoodListProvider";
import { FoodType } from "@/types/model";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { calculateValueFromInStockScore } from "../utils";

const FoodRow = ({
  food,
  style,
  onPress,
}: {
  food: FoodType;
  style: StyleProp<ViewStyle>;
  onPress: (foodId: number) => void;
}) => {
  const { id, name, inStockScore } = food;
  const { foods } = useFoodList();

  return (
    <Pressable
      onPress={() => onPress(food.id)}
      key={id}
      style={{
        height: calculateValueFromInStockScore(inStockScore, foods, 70, 200),
        minHeight: 70,
        ...style,
      }}
    >
      <ThemedText
        style={{
          ...styles.name,
          fontSize: calculateValueFromInStockScore(inStockScore, foods, 18, 26),
        }}
      >
        {name}
      </ThemedText>
      <ThemedText>{Number((inStockScore * 100).toFixed(2))} %</ThemedText>
    </Pressable>
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
