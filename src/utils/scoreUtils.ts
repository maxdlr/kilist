import { FoodType } from "@/types/model";
import type { LevelNumber } from "@/skins/types";

export type FoodInStockScoreThreshold = 0 | 0.25 | 0.5 | 0.75 | 1;

export const THRESHOLDS: FoodInStockScoreThreshold[] = [0, 0.25, 0.5, 0.75, 1];

const LEVEL_BY_THRESHOLD: Record<FoodInStockScoreThreshold, LevelNumber> = {
  0: 1,
  0.25: 2,
  0.5: 3,
  0.75: 4,
  1: 5,
};

export const levelOf = (
  inStockScore?: FoodType["inStockScore"],
): LevelNumber => {
  if (!inStockScore) return 1;

  const closest = THRESHOLDS.reduce((prev, curr) =>
    Math.abs(curr - inStockScore) < Math.abs(prev - inStockScore) ? curr : prev,
  );

  return LEVEL_BY_THRESHOLD[closest];
};
