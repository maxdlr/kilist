import { rules } from "@/offline/rules";
import axios from "@/services/axios";
import type { LevelNumber } from "@/skins/types";
import { THRESHOLDS } from "@/utils/scoreUtils";

export const scoreOfLevel = (level: LevelNumber) => THRESHOLDS[level - 1]!;

export const leavesShopList = (level: LevelNumber) => scoreOfLevel(level) >= (rules().shop.buyBelow ?? 1);

export const putFoodLevel = (foodId: number, level: LevelNumber) =>
  axios.put(`foods/level/${foodId}`, { level: scoreOfLevel(level) });
