import { AppState } from "react-native";
import { buyRangeOf } from "@/hooks/screens/useBuyRange";
import type { ActionPanelRequest } from "@/components/elements/ActionPanel";
import common from "@/i18n/common";
import type { ScannedProduct } from "@/offline/domain";
import useShopList, { type ShopUndo } from "@/providers/ShopListProvider";
import { LATER_LEVEL, putFoodLevel } from "@/utils/foodLevel";
import useMark from "@/providers/MarkProvider";
import { useReportFeedback } from "@/providers/FeedbackStore";
import { problemOf, type Problem } from "@/utils/problem";
import axios from "@/services/axios";
import { FoodType, ListType } from "@/types/model";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import useSWR from "swr";
import { isQuietError } from "@/services/fetcher";

export type ShopAddAction = "buy" | "later" | "list";

export type TripEntry = { foodId: number; action: ShopUndo["action"]; food?: FoodType };

type Pending = { food: FoodType; action: ShopUndo["action"]; resolve: (done: boolean) => void };

const useShopRun = ({ onSaved }: { onSaved?: (bought: number) => void } = {}) => {
  const shop = useShopList();
  const report = useReportFeedback();
  const { mark } = useMark();
  const [undoable, setUndoable] = useState<ShopUndo | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, { message: string; retry: () => void }>>({});
  const { shopListId, startNewShopList, cancelShopList, setShopListId } = shop;
  const [log, setLog] = useState<TripEntry[]>([]);
  const pending = useRef<Pending[]>([]);
  const starting = useRef(false);
  const handled = log.length;
  const bought = log.filter((entry) => entry.action === "buy").length;
  const [isResuming, setIsResuming] = useState(true);
  const [panel, setPanel] = useState<"stop" | "add" | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const { panel: requestedPanel } = useLocalSearchParams<{ panel?: string }>();
  const [handledPanel, setHandledPanel] = useState<string | undefined>();

  if (requestedPanel !== handledPanel) {
    setHandledPanel(requestedPanel);
    if (requestedPanel === "add") setPanel("add");
  }

  useEffect(() => {
    if (requestedPanel) router.setParams({ panel: undefined });
  }, [requestedPanel]);
  const { data: preview, error: previewError, mutate: refreshPreview } = useSWR<FoodType[]>(
    { url: "shop-list/preview" },
    {
      onSuccess: () => report("list", null),
      onError: (err) =>
        !isQuietError(err) &&
        report("list", {
          tone: "error",
          title: common.feedback.load.list,
          body: err?.message || common.feedback.loadLine,
          action: { label: common.feedback.retry, onPress: () => refreshPreview() },
        }),
    },
  );
  const { data: mainList } = useSWR<ListType>({ url: "lists/read?main=true" });

  useFocusEffect(
    useCallback(() => {
      refreshPreview();
      if (shopListId) {
        setIsResuming(false);
        return;
      }
      let active = true;
      axios
        .get<number | null>("shop-list/open")
        .then(({ data }) => {
          if (active && typeof data === "number") setShopListId(data);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setIsResuming(false);
        });
      return () => {
        active = false;
      };
    }, [shopListId, refreshPreview, setShopListId]),
  );

  const settleRow = (foodId: number, failed: Problem | null, message: string, retry: () => void) => {
    setRowErrors((current) => {
      const next = { ...current };
      delete next[foodId];
      if (failed) next[foodId] = { message, retry };
      return next;
    });
    return !failed;
  };

  const foodOf = (foodId: number) =>
    shop.foods?.find((food) => food.id === foodId) ?? preview?.find((food) => food.id === foodId);

  const record = (foodId: number, action: ShopUndo["action"], food?: FoodType) => {
    setLog((entries) => [...entries, { foodId, action, food: food ?? foodOf(foodId) }]);
    setUndoable({ action, foodId });
  };

  const buy = async (foodId: number, food?: FoodType): Promise<boolean> => {
    const failed = await shop.buyFood(foodId);
    if (!failed) record(foodId, "buy", food);
    return settleRow(foodId, failed, common.feedback.notInBasket, () => buy(foodId, food));
  };

  const snooze = async (foodId: number, food?: FoodType): Promise<boolean> => {
    const failed = await shop.snoozeFood(foodId);
    if (!failed) record(foodId, "snooze", food);
    return settleRow(foodId, failed, common.feedback.notLater, () => snooze(foodId, food));
  };

  const drainPending = useEffectEvent(() => {
    const queue = pending.current;
    pending.current = [];
    queue.reduce(
      (chain, entry) =>
        chain.then(async () => {
          const done = await (entry.action === "buy" ? buy : snooze)(entry.food.id, entry.food);
          entry.resolve(done);
        }),
      Promise.resolve(),
    );
  });

  useEffect(() => {
    if (shopListId !== undefined) drainPending();
  }, [shopListId]);

  const act = async (food: FoodType, action: ShopUndo["action"]): Promise<boolean> => {
    if (shopListId !== undefined) return (action === "buy" ? buy : snooze)(food.id, food);
    const done = new Promise<boolean>((resolve) => pending.current.push({ food, action, resolve }));
    if (!starting.current) {
      starting.current = true;
      const id = await startNewShopList();
      starting.current = false;
      if (id === null) {
        pending.current.forEach((entry) => entry.resolve(false));
        pending.current = [];
      }
    }
    return done;
  };

  const undo = async () => {
    const undone = await shop.undoLast();
    setUndoable(null);
    if (!undone) return null;
    setLog((entries) => {
      const at = entries.findLastIndex((entry) => entry.foodId === undone.foodId);
      return at < 0 ? entries : entries.filter((_, index) => index !== at);
    });
    setRowErrors((current) => {
      const next = { ...current };
      delete next[undone.foodId];
      return next;
    });
    return undone;
  };

  const settleRef = useRef(shop.settleLast);

  useEffect(() => {
    settleRef.current = shop.settleLast;
  });

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") return;
      setUndoable(null);
      settleRef.current();
    });
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    useCallback(
      () => () => {
        setUndoable(null);
        settleRef.current();
      },
      [],
    ),
  );

  const refreshEmpty = async () => {
    if (shopListId !== undefined && handled === 0 && !shop.foods?.length) {
      await cancelShopList();
      reset();
      return;
    }
    await refreshPreview();
    if (shopListId !== undefined) await shop.mutateFood();
  };

  const reset = () => {
    setUndoable(null);
    setShopListId(undefined);
    setLog([]);
    setSelected([]);
    setPanel(null);
    refreshPreview();
  };

  const leave = () => {
    reset();
    router.navigate("/");
  };

  const start = async () => {
    setLog([]);
    return startNewShopList();
  };

  const finish = async () => {
    const count = bought;
    await cancelShopList();
    if (onSaved) onSaved(count);
    else leave();
  };

  const discard = async () => {
    await cancelShopList(true);
    leave();
  };

  const close = async () => {
    await cancelShopList();
    reset();
  };

  const foods = shop.foods;
  const total = handled + (foods?.length ?? 0);

  const askStop = () => {
    if (bought === 0) return discard();
    setPanel("stop");
  };

  const stopRequest: ActionPanelRequest = {
    title: common.shop.stopTitle,
    message: common.shop.stopLine(bought, total),
    cancelLabel: common.shop.stopKeep,
    actions: [
      { label: common.shop.stopDiscard, onPress: discard },
      { label: common.shop.stopSave, onPress: finish },
    ],
  };

  const findFood = async (name: string) => {
    if (!name.trim()) return null;
    const { data } = await axios
      .get<FoodType | null>("foods/find", { params: { name } })
      .catch(() => ({ data: null }));
    return data ?? null;
  };

  const addFood = async (name: string, action: ShopAddAction, product?: ScannedProduct | null): Promise<Problem | null> => {
    if (!mainList?.id) return { message: common.feedback.inventoryWait, fields: [] };
    try {
      const { data: food } = await axios.post<FoodType>("foods/create", {
        name,
        listId: mainList.id,
        ...(action !== "buy" && { needed: true }),
        ...(product && { product }),
      });
      if (!food?.id) throw new Error("no food");
      if (action === "buy") await buy(food.id, food);
      else if (action === "later") await snooze(food.id, food);
      refreshPreview();
      mark("added", common.marks.added(name));
      return null;
    } catch (error) {
      return problemOf(error);
    }
  };

  const toggleSelect = (food: FoodType) =>
    setSelected((ids) => (ids.includes(food.id) ? ids.filter((id) => id !== food.id) : [...ids, food.id]));

  const failSave = (error: unknown, retry: () => void) =>
    report("list", {
      tone: "error",
      title: common.feedback.saveFailed,
      body: problemOf(error).message,
      action: { label: common.feedback.retry, onPress: retry },
    });

  const laterIds = async (ids: number[]) => {
    try {
      await Promise.all(ids.map((id) => putFoodLevel(id, LATER_LEVEL)));
      report("list", null);
    } catch (error) {
      failSave(error, () => laterIds(ids));
    }
    refreshPreview();
  };

  const buyLater = async () => {
    const ids = selected;
    setSelected([]);
    if (shopListId === undefined) return laterIds(ids);
    for (const id of ids) await snooze(id);
  };

  const refreshLists = () => {
    refreshPreview();
    if (shopListId !== undefined) shop.mutateFood();
  };

  const rename = async (foodId: number, name: string) => {
    const next = name.trim();
    if (!next || next === foodOf(foodId)?.name) return;
    try {
      await axios.put(`foods/edit/${foodId}`, { name: next });
      report("list", null);
    } catch (error) {
      failSave(error, () => rename(foodId, next));
    }
    refreshLists();
  };

  const removeFoods = async (ids: number[]) => {
    if (!mainList?.id || ids.length === 0) return;
    try {
      await axios.put(`lists/${mainList.id}/remove-foods`, { foodIds: ids });
      report("list", null);
    } catch (error) {
      failSave(error, () => removeFoods(ids));
    }
    refreshLists();
  };

  const removeSelected = () => {
    const ids = selected;
    setSelected([]);
    return removeFoods(ids);
  };

  const suggestion = foods?.find((food) => food.id === shop.suggestedFoodIds[0]);
  const isStarted = shopListId !== undefined;

  return {
    ...shop,
    isLoading: isResuming || (isStarted && shop.isFoodLoading && foods === undefined) || (!isStarted && preview === undefined && !previewError),
    isStarted,
    preview: preview ?? [],
    range: buyRangeOf(preview ?? []),
    isFinished: isStarted && (!foods || foods.length === 0) && handled > 0,
    isEmpty: isStarted ? (!foods || foods.length === 0) && handled === 0 : (preview ?? []).length === 0,
    handled,
    bought,
    total,
    suggestion,
    rows: foods?.filter((food) => food.id !== suggestion?.id) ?? [],
    log,
    buy,
    snooze,
    act,
    rename,
    removeSelected,
    rowError: (foodId: number) => rowErrors[foodId] ?? null,
    canUndo: undoable !== null,
    undo,
    inventoryReady: Boolean(mainList?.id),
    start,
    close,
    finish,
    discard,
    leave,
    reset,
    askStop,
    stopRequest,
    panel,
    openAdd: () => setPanel("add"),
    closePanel: () => setPanel(null),
    findFood,
    addFood,
    refreshEmpty,
    refreshPreview,
    selected,
    toggleSelect,
    clearSelection: () => setSelected([]),
    buyLater,
  };
};

export type ShopRun = ReturnType<typeof useShopRun>;

export default useShopRun;
