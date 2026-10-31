import { ThemedView } from "@/components/themed-view";
import useSwipeFoods from "@/providers/SwipeFoodsProvider";
import { FoodType } from "@/types/model";
import { useState } from "react";
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
  const [step, setStep] = useState(0);
  const { update, swipe, foodsCount } = useSwipeFoods();

  const handleSwipe = async (foodId: number, direction: "left" | "right") => {
    await update({ foodId, isInStock: direction === "right" });
    swipe(foodId);

    setStep((prev) => prev + 1);

    if (step === foodsCount - 1) {
      onComplete();
    }
  };

  const deckAnimStyle = useAnimatedStyle(() => ({
    marginRight: withTiming((foods.length - 1) * 2.5),
  }));

  return (
    <ThemedView style={styles.root}>
      <Animated.View style={[styles.container, deckAnimStyle]}>
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
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SwipeFoods;
