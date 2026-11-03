import useSwipeFoods from "@/providers/SwipeFoodsProvider";
import { FoodType } from "@/types/model";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import SwipeFoodCard from "./_components/SwipeFoodCard";

export interface FoodHistoryCreateType {
  foodId: number;
  isInStock: boolean;
}

const SwipeFoods = ({
  foods,
  onComplete,
}: {
  foods: FoodType[];
  onComplete: () => void;
}) => {
  const { update, swipe } = useSwipeFoods();

  const handleSwipe = async (
    foodId: number,
    direction: "left" | "right" | "up",
  ) => {
    const directionIsInStockMap = {
      right: true,
      left: false,
      up: null,
    };

    try {
      await update({ foodId, isInStock: directionIsInStockMap[direction] });
    } catch (error) {
      console.error("Failed to update food swipe", error);
      return;
    }

    swipe(foodId);

    if (foods.length === 1) {
      onComplete();
    }
  };

  return (
    <Animated.View style={[styles.root]}>
      {foods.map((food, index) => (
        <SwipeFoodCard
          key={food.id}
          food={food}
          onSwipe={handleSwipe}
          i={index}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
});

export default SwipeFoods;
