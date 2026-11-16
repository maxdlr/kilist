import type { ActionPanelRequest } from "@/components/elements/ActionPanel";
import type { SwipeDeckFling, SwipeDeckReturn, SwipeDirection } from "@/components/elements/SwipeDeck/SwipeDeck";
import useSwipeFoods, { SwipeReward } from "@/providers/SwipeFoodsProvider";
import { useSkin } from "@/providers/SkinProvider";
import useTickets from "@/providers/TicketsProvider";
import useMark from "@/providers/MarkProvider";
import useToast from "@/providers/ToastProvider";
import axios from "@/services/axios";
import { caseFor } from "@/skins";
import common from "@/i18n/common";
import { FoodType, ListType } from "@/types/model";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

const IN_STOCK: Record<SwipeDirection, boolean | null> = {
  right: true,
  left: false,
  up: null,
};
const BONUS_VISIBLE_MS = 700;
const HINT_VISIBLE_MS = 900;

type SwipeMode = "daily" | "replay" | "again";

type HeldSwipe = { food: FoodType; direction: SwipeDirection; replay: boolean };

export type SwipeGameScreen = "loading" | "start" | "play" | "done" | "closed" | "empty";

const useSwipeGame = () => {
  const tickets = useTickets();
  const skin = useSkin();
  const { showToast } = useToast();
  const { mark } = useMark();
  const [removing, setRemoving] = useState<FoodType | null>(null);
  const [mode, setMode] = useState<SwipeMode>("daily");
  const {
    foods,
    game,
    isLoading,
    isGameLoading,
    mutateFoods,
    mutateGame,
    swipe,
    unswipe,
    update,
    loadDeck,
    rememberDeck,
    completeSession,
    freezeDeck,
    roundRecap,
    setRoundRecap,
  } = useSwipeFoods();
  const today = new Date().toDateString();
  const recap = roundRecap?.day === today ? roundRecap : undefined;

  const [phase, setPhase] = useState<"idle" | "play" | "done">("idle");
  const [swiped, setSwiped] = useState(0);
  const [outFoods, setOutFoods] = useState<FoodType[]>([]);
  const [intent, setIntentState] = useState<SwipeDirection | null>(null);
  const [hint, setHint] = useState<SwipeDirection | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdHint = useRef(false);
  const [earned, setEarned] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [bonusPop, setBonusPop] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [finishedAt, setFinishedAt] = useState(0);
  const flingRef = useRef<SwipeDeckFling | null>(null);
  const outRef = useRef<FoodType[]>([]);
  const pendingUpdates = useRef<Promise<SwipeReward | null>[]>([]);
  const bonusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef<HeldSwipe | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [returning, setReturning] = useState<SwipeDeckReturn>(null);

  useEffect(() => {
    freezeDeck(phase === "play");
  }, [phase, freezeDeck]);

  useEffect(
    () => () => {
      if (bonusTimer.current) clearTimeout(bonusTimer.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  const setIntent = useCallback((next: SwipeDirection | null) => {
    setIntentState(next);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = null;
    if (next) {
      setHint(next);
    } else if (holdHint.current) {
      hintTimer.current = setTimeout(() => setHint(null), HINT_VISIBLE_MS);
    } else {
      setHint(null);
    }
    holdHint.current = false;
  }, []);

  const collectRef = useRef<(reward: SwipeReward | null) => SwipeReward | null>((reward) => reward);
  const updateRef = useRef(update);

  useEffect(() => {
    updateRef.current = update;
  });

  const commitHeld = useCallback(() => {
    const held = heldRef.current;
    if (!held) return;
    heldRef.current = null;
    setCanUndo(false);
    pendingUpdates.current.push(
      updateRef
        .current({
          foodId: held.food.id,
          isInStock: IN_STOCK[held.direction],
          ...(held.replay && { replay: true }),
        })
        .then((reward) => collectRef.current(reward)),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      mutateGame();
      mutateFoods();
      return () => {
        commitHeld();
        setPhase((current) => (current === "done" ? "idle" : current));
      };
    }, [mutateFoods, mutateGame, commitHeld]),
  );

  useEffect(() => () => commitHeld(), [commitHeld]);

  const playDeck = async (next: Exclude<SwipeMode, "daily">) => {
    const count = await loadDeck(next);
    if (count === 0) {
      if (next === "again") showToast(skin.copy.swipe.allChecked);
      return false;
    }
    setMode(next);
    start();
    return true;
  };

  const begin = () => {
    setMode("daily");
    rememberDeck((foods ?? []).map((food) => food.id));
    start();
  };

  const start = () => {
    setSwiped(0);
    outRef.current = [];
    setOutFoods([]);
    setEarned(0);
    setBonus(0);
    setStartedAt(Date.now());
    setFinishedAt(0);
    pendingUpdates.current = [];
    heldRef.current = null;
    setCanUndo(false);
    setReturning(null);
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

  useEffect(() => {
    collectRef.current = collect;
  });

  const finishRound = (added: FoodType[]) => {
    setFinishedAt(Date.now());
    setPhase("done");
    setRoundRecap({ day: today, added });
    Promise.allSettled(pendingUpdates.current)
      .then(completeSession)
      .then(tickets.refresh);
  };

  const handleSwipe = (food: FoodType, direction: SwipeDirection) => {
    const isLast = foods?.length === 1;

    holdHint.current = true;
    if (direction === "left") outRef.current = [...outRef.current, food];
    const added = outRef.current;
    setSwiped((count) => count + 1);
    setOutFoods(added);
    swipe(food.id);
    commitHeld();
    heldRef.current = { food, direction, replay: mode === "replay" };
    setCanUndo(true);

    if (isLast) {
      commitHeld();
      finishRound(added);
    }
  };

  const undo = () => {
    const held = heldRef.current;
    if (!held) return;
    heldRef.current = null;
    setCanUndo(false);
    if (held.direction === "left") {
      outRef.current = outRef.current.filter((entry) => entry.id !== held.food.id);
      setOutFoods(outRef.current);
    }
    setSwiped((count) => Math.max(0, count - 1));
    holdHint.current = false;
    setIntent(null);
    setReturning({ key: held.food.id, direction: held.direction });
    unswipe(held.food);
  };

  const remove = async (food: FoodType) => {
    commitHeld();
    try {
      const { data: list } = await axios.get<ListType>("lists/read?main=true");
      if (!list?.id) throw new Error("no list");
      await axios.put(`lists/${list.id}/remove-foods`, { foodIds: [food.id] });
    } catch {
      showToast(common.unexpected);
      return;
    }
    mark("removed", common.marks.removed(1));
    const isLast = foods?.length === 1;
    swipe(food.id);
    if (!isLast) return;
    if (swiped > 0) finishRound(outRef.current);
    else {
      setPhase("idle");
      mutateFoods();
    }
  };

  const removeRequest: ActionPanelRequest | null = removing && {
    title: skin.copy.inventory.removeOne(caseFor(skin, removing.name)),
    message: skin.copy.inventory.removeLine,
    cancelLabel: skin.copy.common.keep,
    actions: [{ label: skin.copy.common.remove, destructive: true, onPress: () => remove(removing) }],
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
    hint,
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
    replay: () => playDeck("replay"),
    playAgain: () => playDeck("again"),
    isReplay: mode === "replay",
    mode,
    recap,
    handleSwipe,
    canUndo,
    undo,
    returning,
    askRemove: setRemoving,
    removeRequest,
    cancelRemove: () => setRemoving(null),
    reset: () => setPhase("idle"),
    refreshFoods: () => mutateFoods(),
  };
};

export type SwipeGame = ReturnType<typeof useSwipeGame>;

export default useSwipeGame;
