import { Colors } from "@/constants/theme";
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

export interface FoodTypeDisplay {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  color: Record<5 | 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90, string>;
}

export const inStockScoreToDisplay = (
  inStockScore?: number,
  theme: (typeof Colors)["light" | "dark"] = Colors.light,
): FoodTypeDisplay => {
  if (!inStockScore) {
    return { level: 1, label: "Needed", color: theme.foods[1] };
  }

  const map: Record<number, FoodTypeDisplay> = {
    0: { level: 1, label: "Needed", color: theme.foods[1] },
    0.25: { level: 2, label: "Should buy", color: theme.foods[2] },
    0.5: { level: 3, label: "Can wait", color: theme.foods[3] },
    0.75: { level: 4, label: "Still some", color: theme.foods[4] },
    1: { level: 5, label: "Plenty", color: theme.foods[5] },
  };

  const closestKey: string = Object.keys(map).reduce((prev, curr) => {
    return Math.abs(Number(curr) - inStockScore) <
      Math.abs(Number(prev) - inStockScore)
      ? curr
      : prev;
  });

  const key: keyof typeof map = Number(closestKey) as keyof typeof map;

  return map[Number(key)];
};
