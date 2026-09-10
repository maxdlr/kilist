import { ThemedText } from "@/components/themed-text";
import { FoodType } from "@/types/model";

const SwipeFoodCard = ({
  food,
  onSwipe,
}: {
  food: FoodType;
  onSwipe: (foodId: number, direction: "left" | "right") => void;
}) => {
  return <ThemedText>{food.name}</ThemedText>;
};
export default SwipeFoodCard;
