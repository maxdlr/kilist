import type { SwipeGameType } from "@/providers/SwipeFoodsProvider";
import { FoodType } from "@/types/model";
import { useMemo } from "react";
import useSWR from "swr";

const useRoundOpen = () => {
  const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  const { data: foods } = useSWR<FoodType[]>({ url: "foods/swipe/browse" });
  const { data: game } = useSWR<SwipeGameType>({ url: "swipe-list/game", params: { tzOffset } });
  const count = foods?.length ?? 0;
  return { count, pending: count > 0 && game?.playedToday === false };
};

export default useRoundOpen;
