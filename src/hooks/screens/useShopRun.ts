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
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { isQuietError } from "@/services/fetcher";

export type ShopAddAction = "buy" | "later" | "list";

const useShopRun = ({ onSaved }: { onSaved?: (bought: number) => void } = {}) => {
  const shop = useShopList();
  const report = useReportFeedback();
  const { mark } = useMark();
  const [undoable, setUndoable] = useState<ShopUndo | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, { message: string; retry: () => void }>>({});
  const { shopListId, startNewShopList, cancelShopList, setShopListId } = shop;
  const [handled, setHandled] = useState(0);
  const [bought, setBought] = useState(0);
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

  const buy = async (foodId: number): Promise<boolean> => {
    const failed = await shop.buyFood(foodId);
    if (!failed) {
      setHandled((count) => count + 1);
      setBought((count) => count + 1);
      setUndoable({ action: "buy", foodId });
    }
    return settleRow(foodId, failed, common.feedback.notInBasket, () => buy(foodId));
  };

  const snooze = async (foodId: number): Promise<boolean> => {
    const failed = await shop.snoozeFood(foodId);
    if (!failed) {
      setHandled((count) => count + 1);
      setUndoable({ action: "snooze", foodId });
    }
    return settleRow(foodId, failed, common.feedback.notLater, () => snooze(foodId));
  };

  const undo = async () => {
    const undone = await shop.undoLast();
    setUndoable(null);
    if (!undone) return null;
    setHandled((count) => Math.max(0, count - 1));
    if (undone.action === "buy") setBought((count) => Math.max(0, count - 1));
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
    setHandled(0);
    setBought(0);
    setPanel(null);
    refreshPreview();
  };

  const leave = () => {
    reset();
    router.navigate("/");
  };

  const start = async () => {
    setHandled(0);
    setBought(0);
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
      if (action === "buy") await buy(food.id);
      else if (action === "later") await snooze(food.id);
      refreshPreview();
      mark("added", common.marks.added(name));
      return null;
    } catch (error) {
      return problemOf(error);
    }
  };

  const toggleSelect = (food: FoodType) =>
    setSelected((ids) => (ids.includes(food.id) ? ids.filter((id) => id !== food.id) : [...ids, food.id]));

  const laterIds = async (ids: number[]) => {
    try {
      await Promise.all(ids.map((id) => putFoodLevel(id, LATER_LEVEL)));
      report("list", null);
    } catch (error) {
      report("list", {
        tone: "error",
        title: common.feedback.saveFailed,
        body: problemOf(error).message,
        action: { label: common.feedback.retry, onPress: () => laterIds(ids) },
      });
    }
    refreshPreview();
  };

  const buyLater = async () => {
    const ids = selected;
    setSelected([]);
    await laterIds(ids);
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
    buy,
    snooze,
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
