import { FoodType } from "@/types/model";

export interface SwipeFoodCardProps {
  food: FoodType;
  onSwipe: (foodId: number, direction: "left" | "right") => void;
}
