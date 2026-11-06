import { FoodType } from "@/types/model";
import { Image } from "expo-image";
import FoodIcon from "./FoodIcon";

const FoodPicture = ({
  food,
  size,
}: {
  food: Pick<FoodType, "icon" | "imageUrl">;
  size: number;
}) =>
  food.imageUrl ? (
    <Image
      source={{ uri: food.imageUrl }}
      style={{ height: size, width: size }}
      contentFit="contain"
      accessibilityIgnoresInvertColors
    />
  ) : (
    <FoodIcon name={food.icon} size={size} />
  );

export default FoodPicture;
