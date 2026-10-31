import { ThemedView } from "@/components/themed-view";
import useSwipeFoods from "@/providers/SwipeFoodsProvider";
import { FoodType } from "@/types/model";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
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

  const deckAnimStyle = useAnimatedStyle(() => ({
    marginRight: withTiming((foods.length - 1) * 2.5),
  }));

  return (
    <Animated.View style={[styles.root, deckAnimStyle]}>
      {foods.map((food, index) => (
        <ThemedView
          key={food.id}
          style={{
            position: "absolute",
            paddingBottom: index * 10,
            paddingLeft: index * 5,
          }}
        >
          <SwipeFoodCard key={food.id} food={food} onSwipe={handleSwipe} />
        </ThemedView>
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: "100%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SwipeFoods;
