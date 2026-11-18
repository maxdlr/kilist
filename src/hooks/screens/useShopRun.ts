import { buyRangeOf } from "@/hooks/screens/useBuyRange";
import type { ActionPanelRequest } from "@/components/elements/ActionPanel";
import common from "@/i18n/common";
import type { ScannedProduct } from "@/offline/domain";
import useShopList from "@/providers/ShopListProvider";
import { LATER_LEVEL, putFoodLevel } from "@/utils/foodLevel";
import useMark from "@/providers/MarkProvider";
import useToast from "@/providers/ToastProvider";
import axios from "@/services/axios";
import { FoodType, ListType } from "@/types/model";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";

export type ShopAddAction = "buy" | "later" | "list";

const useShopRun = ({ onSaved }: { onSaved?: (bought: number) => void } = {}) => {
  const shop = useShopList();
  const { showToast } = useToast();
  const { mark } = useMark();
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
  const { data: preview, mutate: refreshPreview } = useSWR<FoodType[]>({ url: "shop-list/preview" });
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

  const buy = (foodId: number) => {
    setHandled((count) => count + 1);
    setBought((count) => count + 1);
    return shop.buyFood(foodId);
  };

  const snooze = (foodId: number) => {
    setHandled((count) => count + 1);
    return shop.snoozeFood(foodId);
  };

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

  const addFood = async (name: string, action: ShopAddAction, product?: ScannedProduct | null) => {
    if (!mainList?.id) {
      showToast(common.inventoryNotReady);
      return false;
    }
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
      return true;
    } catch {
      showToast(common.addFailed);
      return false;
    }
  };

  const toggleSelect = (food: FoodType) =>
    setSelected((ids) => (ids.includes(food.id) ? ids.filter((id) => id !== food.id) : [...ids, food.id]));

  const buyLater = async () => {
    const ids = selected;
    setSelected([]);
    try {
      await Promise.all(ids.map((id) => putFoodLevel(id, LATER_LEVEL)));
    } catch {
      showToast(common.unexpected);
    }
    refreshPreview();
  };

  const suggestion = foods?.find((food) => food.id === shop.suggestedFoodIds[0]);
  const isStarted = shopListId !== undefined;

  return {
    ...shop,
    isLoading: isResuming || (isStarted && shop.isFoodLoading && foods === undefined) || (!isStarted && preview === undefined),
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
