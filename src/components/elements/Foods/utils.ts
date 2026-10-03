import { FoodType } from "@/types/model";

export const calculateValueFromInStockScore = (
  inStockScore: number,
  foods?: FoodType[],
  min = 50,
  max = 200,
) => {
  const highestInStockScore = Math.max(
    ...(foods?.map((i) => i.inStockScore) || [0]),
  );
  const lowestInStockScore = Math.min(
    ...(foods?.map((i) => i.inStockScore) || [1]),
  );

  if (highestInStockScore === lowestInStockScore) {
    return max;
  }

  return (
    min +
    (1 -
      (inStockScore - lowestInStockScore) /
        (highestInStockScore - lowestInStockScore)) *
      (max - min)
  );
};
