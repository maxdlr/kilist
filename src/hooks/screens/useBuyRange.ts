import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import useSWR from "swr";

const SOON_LEVEL = 2;

export const buyRangeOf = (foods: FoodType[]) => ({
  low: foods.filter((food) => levelOf(food.inStockScore) <= SOON_LEVEL).length,
  high: foods.length,
});

const useBuyRange = () => {
  const { data, mutate } = useSWR<FoodType[]>({ url: "shop-list/preview" });

  useFocusEffect(
    useCallback(() => {
      mutate();
    }, [mutate]),
  );

  return buyRangeOf(data ?? []);
};

export default useBuyRange;
