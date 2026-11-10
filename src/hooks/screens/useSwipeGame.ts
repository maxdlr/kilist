import type { SwipeDeckFling, SwipeDirection } from "@/components/elements/SwipeDeck/SwipeDeck";
import useSwipeFoods, { SwipeReward } from "@/providers/SwipeFoodsProvider";
import useTickets from "@/providers/TicketsProvider";
import { FoodType } from "@/types/model";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

const IN_STOCK: Record<SwipeDirection, boolean | null> = {
  right: true,
  left: false,
  up: null,
};
const BONUS_VISIBLE_MS = 700;

export const SWIPE_TICKETS = 10;

export type SwipeGameScreen = "loading" | "start" | "play" | "done" | "closed" | "empty";

const useSwipeGame = () => {
  const tickets = useTickets();
  const {
    foods,
    game,
    isLoading,
    isGameLoading,
    mutateFoods,
    mutateGame,
    swipe,
    update,
    completeSession,
    freezeDeck,
  } = useSwipeFoods();

  const [phase, setPhase] = useState<"idle" | "play" | "done">("idle");
  const [swiped, setSwiped] = useState(0);
  const [outFoods, setOutFoods] = useState<FoodType[]>([]);
  const [intent, setIntent] = useState<SwipeDirection | null>(null);
  const [earned, setEarned] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [bonusPop, setBonusPop] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [finishedAt, setFinishedAt] = useState(0);
  const flingRef = useRef<SwipeDeckFling | null>(null);
  const pendingUpdates = useRef<Promise<SwipeReward | null>[]>([]);
  const bonusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    freezeDeck(phase === "play");
  }, [phase, freezeDeck]);

  useEffect(
    () => () => {
      if (bonusTimer.current) clearTimeout(bonusTimer.current);
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      mutateGame();
      mutateFoods();
      return () => {
        setPhase((current) => (current === "done" ? "idle" : current));
      };
    }, [mutateFoods, mutateGame]),
  );

  const begin = () => {
    setSwiped(0);
    setOutFoods([]);
    setEarned(0);
    setBonus(0);
    setStartedAt(Date.now());
    setFinishedAt(0);
    pendingUpdates.current = [];
    setPhase("play");
  };

  const collect = (reward: SwipeReward | null) => {
    if (!reward) return reward;
    setEarned((total) => total + reward.earned);
    setBonus((total) => total + reward.bonus);
    if (reward.balance !== null) tickets.setBalance(reward.balance);
    if (reward.bonus > 0) {
      setBonusPop(reward.bonus);
      if (bonusTimer.current) clearTimeout(bonusTimer.current);
      bonusTimer.current = setTimeout(() => setBonusPop(0), BONUS_VISIBLE_MS);
    }
    return reward;
  };

  const handleSwipe = (food: FoodType, direction: SwipeDirection) => {
    const isLast = foods?.length === 1;

    setSwiped((count) => count + 1);
    if (direction === "left") setOutFoods((out) => [...out, food]);
    swipe(food.id);
    pendingUpdates.current.push(
      update({ foodId: food.id, isInStock: IN_STOCK[direction] }).then(collect),
    );

    if (isLast) {
      setFinishedAt(Date.now());
      setPhase("done");
      Promise.allSettled(pendingUpdates.current)
        .then(completeSession)
        .then(tickets.refresh);
    }
  };

  const fling = (direction: SwipeDirection) => flingRef.current?.(direction);

  const isFetching = (isLoading && !foods) || (isGameLoading && !game);
  const screen: SwipeGameScreen =
    phase === "done"
      ? "done"
      : isFetching
        ? "loading"
        : phase === "play" && foods?.length
          ? "play"
          : game?.playedToday
            ? "closed"
            : !foods?.length
              ? "empty"
              : "start";

  return {
    screen,
    foods: foods ?? [],
    level: game?.level ?? 1,
    position: swiped,
    total: swiped + (foods?.length ?? 0),
    outFoods,
    intent,
    setIntent,
    earned,
    bonus,
    bonusPop,
    seconds: finishedAt ? Math.round((finishedAt - startedAt) / 1000) : 0,
    balance: tickets.counter?.balance,
    counter: tickets.counter,
    nextPrize: tickets.nextPrize,
    nextPrizeFunds: tickets.nextPrizeFunds,
    flingRef,
    fling,
    begin,
    handleSwipe,
    reset: () => setPhase("idle"),
    refreshFoods: () => mutateFoods(),
  };
};

export type SwipeGame = ReturnType<typeof useSwipeGame>;

export default useSwipeGame;
