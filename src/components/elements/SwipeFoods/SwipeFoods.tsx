import { ThemedView } from "@/components/themed-view";
import useAxios from "@/hooks/useAxios";
import { FoodType } from "@/types/model";
import { useState } from "react";
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
  const [formData, setFormData] = useState<FoodHistoryCreateType[]>([]);

  const { postData } = useAxios("food-histories/add");

  const handleSwipe = async (foodId: number, direction: "left" | "right") => {
    if (direction === "right") {
      setFormData((prev) => [
        ...prev,
        {
          foodId,
          isInStock: true,
        },
      ]);
    }

    setStep((prev) => prev + 1);

    if (step === foods.length - 1) {
      await postData(formData);
      onComplete();
    }
  };

  return (
    <ThemedView>
      <ThemedView>
        {foods?.map((f) => (
          <SwipeFoodCard key={f.id} food={f} onSwipe={handleSwipe} />
        ))}
      </ThemedView>
    </ThemedView>
  );
};

export default SwipeFoods;
