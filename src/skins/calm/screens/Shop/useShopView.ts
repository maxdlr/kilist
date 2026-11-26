import useRunAisles from "@/hooks/screens/useRunAisles";
import type { ShopRun, TripEntry } from "@/hooks/screens/useShopRun";
import common from "@/i18n/common";
import { loadValue, saveValue } from "@/offline/store";
import { FoodType } from "@/types/model";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import T from "@/skins/calm/text";

const SUGGESTIONS_KEY = "shopSuggestions";

const AUTO_FINISH_MS = 900;

export type SunkFood = { food: FoodType; action: TripEntry["action"] };

export type TripSummary = { bought: FoodType[]; later: FoodType[]; left: FoodType[] };

const foodsOf = (log: TripEntry[], action: TripEntry["action"]) =>
  log.flatMap((entry) => (entry.action === action && entry.food ? [entry.food] : []));

export const tripSummary = (run: ShopRun): TripSummary => {
  const logged = new Set(run.log.map((entry) => entry.foodId));
  return {
    bought: foodsOf(run.log, "buy"),
    later: foodsOf(run.log, "snooze"),
    left: (run.foods ?? []).filter((food) => !logged.has(food.id)),
  };
};

const useShopView = (run: ShopRun) => {
  const [moving, setMoving] = useState<SunkFood[]>([]);
  const [renaming, setRenaming] = useState<{ id: number; draft: string } | null>(null);
  const editing = useRef<{ id: number; draft: string } | null>(null);
  const [details, setDetails] = useState<FoodType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [suggesting, setSuggesting] = useState(() => loadValue<boolean>(SUGGESTIONS_KEY) ?? true);

  const logged = new Set(run.log.map((entry) => entry.foodId));
  const inFlight = moving.filter((entry) => !logged.has(entry.food.id));
  const gone = new Set([...inFlight.map((entry) => entry.food.id), ...logged]);
  const source = run.isStarted ? (run.foods ?? run.preview) : run.preview;
  const open = source.filter((food) => !gone.has(food.id));
  const sunk: SunkFood[] = [
    ...inFlight,
    ...run.log.flatMap((entry) => (entry.food ? [{ food: entry.food, action: entry.action }] : [])).reverse(),
  ];
  const suggestion = suggesting && run.suggestion && open.some((food) => food.id === run.suggestion?.id) ? run.suggestion : undefined;
  const running = run.isStarted || inFlight.length > 0;
  const aisles = useRunAisles({
    open,
    done: sunk.map((entry) => entry.food),
    hiddenId: suggestion?.id,
    runKey: run.shopListId ?? null,
    frozen: running,
    otherLabel: T.shop.otherAisle,
  });

  const swipe = async (food: FoodType, action: TripEntry["action"]) => {
    setMoving((list) => [{ food, action }, ...list]);
    await run.act(food, action);
    setMoving((list) => list.filter((entry) => entry.food.id !== food.id));
  };

  const undo = async () => {
    const undone = await run.undo();
    const name = undone && run.log.find((entry) => entry.foodId === undone.foodId)?.food?.name;
    if (name) AccessibilityInfo.announceForAccessibility(common.shop.undone(name));
  };

  const editRename = (next: { id: number; draft: string } | null) => {
    editing.current = next;
    setRenaming(next);
  };

  const commitRename = () => {
    const current = editing.current;
    editRename(null);
    if (current) run.rename(current.id, current.draft);
  };

  const left = open.length;
  const allDone = run.isStarted && left === 0 && inFlight.length === 0 && run.log.length > 0;
  const finishTrip = useEffectEvent(() => {
    run.finish();
  });

  useEffect(() => {
    if (!allDone) return;
    const timer = setTimeout(finishTrip, AUTO_FINISH_MS);
    return () => clearTimeout(timer);
  }, [allDone]);
  const bought = run.log.filter((entry) => entry.action === "buy").length;

  return {
    running,
    open,
    sunk,
    suggestion,
    suggestionLabel: suggestion ? aisles.labelOf(aisles.sectionOf(suggestion.id)) : null,
    sections: aisles.sections,
    subtitle: running ? T.shop.tripLine(bought, left) : T.shop.toBuy(left),
    swipe,
    undo,
    actionOf: (foodId: number) => sunk.find((entry) => entry.food.id === foodId)?.action ?? "buy",
    suggesting,
    setSuggesting: (on: boolean) => {
      setSuggesting(on);
      saveValue(SUGGESTIONS_KEY, on);
    },
    renaming,
    startRename: (food: FoodType) => {
      run.clearSelection();
      editRename({ id: food.id, draft: food.name });
    },
    setDraft: (draft: string) => {
      if (editing.current) editRename({ ...editing.current, draft });
    },
    commitRename,
    cancelRename: () => editRename(null),
    details,
    openDetails: (food: FoodType) => {
      run.clearSelection();
      setDetails(food);
    },
    closeDetails: () => setDetails(null),
    confirmDelete,
    askDelete: () => setConfirmDelete(true),
    closeDelete: () => setConfirmDelete(false),
  };
};

export type ShopView = ReturnType<typeof useShopView>;

export default useShopView;
