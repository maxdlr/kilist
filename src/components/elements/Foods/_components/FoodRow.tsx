import { ThemedText } from "@/components/themed-text";
import useFoodList from "@/providers/FoodListProvider";
import { FoodType } from "@/types/model";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import { calculateValueFromInStockScore } from "../utils";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import SwipeGesture from "@/components/elements/SwipeGesture";

const FoodRow = ({
  food,
  style,
  onBuy,
  onDismiss,
  onOptions,
}: {
  food: FoodType;
  style?: StyleProp<ViewStyle>;
  onBuy: (foodId: number) => void;
  onDismiss?: (foodId: number) => void;
  onOptions?: (foodId: number) => void;
}) => {
  const { id, name, inStockScore } = food;
  const { foods } = useFoodList();
  const theme = useTheme();

  return (
    <SwipeGesture
      onSwipeRight={() => onBuy(id)}
      onSwipeLeft={() => onDismiss?.(id)}
      onLongPress={() => onOptions?.(id)}
      styles={{
        box: {
          height: calculateValueFromInStockScore(inStockScore, foods, 50, 100),
          ...styles.item,
          borderBottomColor: theme.textSecondary,
          ...style,
        },
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
    </SwipeGesture>
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
