import { ThemedView } from "@/components/themed-view";
import useAxios from "@/hooks/useAxios";
import { FoodType } from "@/types/model";
import { useState } from "react";
import SwipeFoodCard from "./_components/SwipeFoodCard";
import { StyleSheet } from "react-native";

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
  const [formData, setFormData] = useState<FoodHistoryCreateType[]>([]);

  const { postData } = useAxios("food-histories/add");

  const handleSwipe = async (foodId: number, direction: "left" | "right") => {
    const updatedFormData = [
      ...formData,
      { foodId, isInStock: direction === "right" },
    ];

    setFormData(updatedFormData);
    setStep((prev) => prev + 1);

    if (step === foods.length - 1) {
      await postData(updatedFormData);
      onComplete();
    }
  };

  return (
    <ThemedView style={styles.root}>
      <ThemedView style={styles.container}>
        {step < foods.length && (
          <SwipeFoodCard food={foods[step]} onSwipe={handleSwipe} />
        )}
      </ThemedView>
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
