import type { ShopRun } from "@/hooks/screens/useShopRun";
import common from "@/i18n/common";
import { FoodType } from "@/types/model";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { TICK_MS } from "./_components/ShopPill";

const AUTO_FINISH_MS = 900;

const useRunPills = (run: ShopRun) => {
  const [ticking, setTicking] = useState<number[]>([]);
  const [gone, setGone] = useState<number[]>([]);
  const [flick, setFlick] = useState<{ id: number; armed: boolean } | null>(null);
  const [touched, setTouched] = useState(false);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const names = useRef(new Map<number, string>());

  const remaining = (run.foods ?? []).filter((food) => !gone.includes(food.id));
  const suggestion = run.suggestion && !gone.includes(run.suggestion.id) ? run.suggestion : undefined;

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const finishRun = useEffectEvent(() => {
    run.finish();
  });
  const allDone = run.isFinished && ticking.length === 0;

  useEffect(() => {
    if (!allDone) return;
    const timer = setTimeout(finishRun, AUTO_FINISH_MS);
    return () => clearTimeout(timer);
  }, [allDone]);

  const stopTick = (foodId: number) => {
    clearTimeout(timers.current.get(foodId));
    timers.current.delete(foodId);
    setTicking((list) => list.filter((id) => id !== foodId));
  };

  const commit = async (food: FoodType, action: "buy" | "later") => {
    names.current.set(food.id, food.name);
    setGone((list) => [...list, food.id]);
    const done = action === "buy" ? await run.buy(food.id) : await run.snooze(food.id);
    if (!done) setGone((list) => list.filter((id) => id !== food.id));
  };

  const tap = (food: FoodType) => {
    setTouched(true);
    if (timers.current.has(food.id)) {
      stopTick(food.id);
      return;
    }
    setTicking((list) => [...list, food.id]);
    timers.current.set(
      food.id,
      setTimeout(() => {
        stopTick(food.id);
        commit(food, "buy");
      }, TICK_MS),
    );
  };

  const flickAway = (food: FoodType) => {
    setFlick(null);
    stopTick(food.id);
    commit(food, "later");
  };

  const armFlick = (food: FoodType, armed: boolean | null) => {
    setTouched(true);
    setFlick(armed === null ? null : { id: food.id, armed });
  };

  const undo = async (onBack: (foodId: number) => void) => {
    const undone = await run.undo();
    if (!undone) return;
    setGone((list) => list.filter((id) => id !== undone.foodId));
    onBack(undone.foodId);
    const name = names.current.get(undone.foodId);
    if (name) AccessibilityInfo.announceForAccessibility(common.shop.undone(name));
  };

  return {
    remaining,
    suggestion,
    isTicking: (foodId: number) => ticking.includes(foodId),
    anyTicking: ticking.length > 0,
    flickArmed: Boolean(flick?.armed),
    teach: run.handled === 0 && !touched,
    tap,
    flickAway,
    armFlick,
    undo,
  };
};

export default useRunPills;
