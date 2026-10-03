import { ThemedText } from "@/components/themed-text";
import useFoodList from "@/providers/FoodListProvider";
import { FoodType } from "@/types/model";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { calculateValueFromInStockScore } from "../utils";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

const FoodRow = ({
  food,
  style,
  onPress,
}: {
  food: FoodType;
  style?: StyleProp<ViewStyle>;
  onPress: (foodId: number) => void;
}) => {
  const { id, name, inStockScore } = food;
  const { foods } = useFoodList();
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onPress(food.id)}
      key={id}
      style={{
        height: calculateValueFromInStockScore(inStockScore, foods, 50, 100),
        ...styles.item,
        borderBottomColor: theme.textSecondary,
        ...style,
      }}
    >
      <ThemedText
        style={{
          ...styles.name,
          fontSize: calculateValueFromInStockScore(inStockScore, foods, 22, 26),
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
    paddingHorizontal: Spacing.four,
    borderBottomWidth: 1,
  },

  name: {
    fontSize: 26,
    fontWeight: "bold",
  },
});

export default FoodRow;
