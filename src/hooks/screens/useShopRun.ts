import { buyRangeOf } from "@/hooks/screens/useBuyRange";
import type { ActionPanelRequest } from "@/components/elements/ActionPanel";
import common from "@/i18n/common";
import type { ScannedProduct } from "@/offline/domain";
import useHousehold from "@/providers/HouseholdProvider";
import useShopList from "@/providers/ShopListProvider";
import useToast from "@/providers/ToastProvider";
import axios from "@/services/axios";
import { FoodType, ListType } from "@/types/model";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import useSWR from "swr";

export type ShopAddAction = "buy" | "later";

export type ScanResult = { name: string; product: ScannedProduct; conflicts: string[] };

const useShopRun = ({ onSaved }: { onSaved?: (bought: number) => void } = {}) => {
  const shop = useShopList();
  const { showToast } = useToast();
  const { household } = useHousehold();
  const { shopListId, startNewShopList, cancelShopList, setShopListId } = shop;
  const [handled, setHandled] = useState(0);
  const [bought, setBought] = useState(0);
  const [isResuming, setIsResuming] = useState(true);
  const [panel, setPanel] = useState<"stop" | "add" | null>(null);
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
    await refreshPreview();
    if (shopListId) await shop.mutateFood();
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

  const stop = async () => {
    await cancelShopList();
    leave();
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

  const findProduct = async (barcode: string): Promise<ScanResult | null> => {
    const { data: known } = await axios
      .get<FoodType | null>("foods/find", { params: { barcode } })
      .catch(() => ({ data: null }));
    if (known?.name) return { name: known.name, product: { barcode }, conflicts: [] };

    try {
      const { data } = await axios.get<{ name: string; icon?: string; tags?: string[]; quantity?: string }>(
        `products/${barcode}`,
      );
      if (!data?.name) throw new Error("no product");
      const avoided = household?.eaterProfiles ?? [];
      return {
        name: data.name,
        product: { barcode, icon: data.icon, quantity: data.quantity },
        conflicts: (data.tags ?? []).filter((tag) => avoided.includes(tag)),
      };
    } catch (error: any) {
      showToast(error?.response?.data?.message || common.shop.scanFailed);
      return null;
    }
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
        ...(action === "later" && { needed: true }),
        ...(product && { product }),
      });
      if (!food?.id) throw new Error("no food");
      if (action === "buy") await buy(food.id);
      else await snooze(food.id);
      refreshPreview();
      return true;
    } catch {
      showToast(common.addFailed);
      return false;
    }
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
    stop,
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
    findProduct,
    addFood,
    refreshEmpty,
  };
};

export type ShopRun = ReturnType<typeof useShopRun>;

export default useShopRun;
