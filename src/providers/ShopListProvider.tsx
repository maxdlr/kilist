import common from "@/i18n/common";
import useAxios from "@/hooks/useAxios";
import useToast from "@/providers/ToastProvider";
import { FoodType, ShopListType } from "@/types/model";
import React, { createContext, ReactNode, useMemo, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { isQuietError } from "@/services/fetcher";

export type ShopListContextType = {
  foods?: FoodType[];
  shopListId?: number;

  isFoodLoading: boolean;
  mutateFood: () => void;
  buyFood: (currentFoodId: number) => Promise<void>;
  startNewShopList: () => Promise<number | null>;
  startShopClock: () => Promise<void>;
  cancelShopList: (discard?: boolean) => Promise<ShopListType>;
  snoozeFood: (foodId: number) => Promise<void>;
  suggestedFoodIds: number[];
  orderFoodBy: (type: "score" | "name") => void;
  reverseOrderFood: () => void;
  orderedBy: "score" | "name";
  setShopListId: (id: number | undefined) => void;
};

const ShopListContext = createContext<ShopListContextType>({
  foods: [],
  shopListId: undefined,

  isFoodLoading: false,
  mutateFood: () => {},
  orderFoodBy: () => {},
  buyFood: async () => {},
  startNewShopList: async () => null,
  startShopClock: async () => {},
  cancelShopList: async () => ({}) as Promise<ShopListType>,
  snoozeFood: async () => {},
  suggestedFoodIds: [],
  reverseOrderFood: () => {},
  orderedBy: "score",
  setShopListId: () => {},
});

export const ShopListProvider = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast();
  const [shopListId, setShopListId] = useState<number | undefined>();
  const [isStarting, setIsStarting] = useState(false);
  const [suggestedFoodIds, setSuggestedFoodIds] = useState<number[]>([]);
  const [orderedBy, setOrderedBy] = useState<"score" | "name">("score");

  const {
    data,
    isLoading,
    mutate: mutateFood,
  } = useSWR<ShopListType>(
    {
      url: shopListId ? `shop-list/${shopListId}` : null,
    },
    {
      onSuccess: () => {},
      onError: (err) => !isQuietError(err) && showToast(err?.message || common.unexpected),
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      retryCount: 3,
      revalidateOnMount: true,
      loadingTimeout: 5000,
      keepPreviousData: true,
    } as SWRConfiguration,
  );

  const [reversed, setReversed] = useState(false);
  const foods = useMemo(() => {
    if (!data) return undefined;
    const sorted = [...data.foods].sort((a, b) =>
      orderedBy === "name"
        ? a.name.localeCompare(b.name)
        : (a.inStockScore || 0) - (b.inStockScore || 0),
    );
    return reversed ? sorted.reverse() : sorted;
  }, [data, orderedBy, reversed]);
  const isFoodLoading = isStarting || isLoading;

  const { postData: startShopList } = useAxios("shop-list/start");
  const { postData: endShopList } = useAxios(`shop-list/cancel/${shopListId}`);
  const { putData: editFood } = useAxios(`shop-list/edit/${shopListId}`);
  const { postData: postShopClock } = useAxios(`shop-list/clock/${shopListId}`);

  const orderFoodBy = (type: "score" | "name") => {
    setOrderedBy(type);
    setReversed(false);
  };

  const reverseOrderFood = () => setReversed((current) => !current);

  const buyFood = async (foodId: number) => {
    const res = await editFood({
      foodId,
      action: "buy",
    });
    if (res.error) {
      showToast(res.error.message || common.unexpected);
      return;
    }
    setSuggestedFoodIds((res.data as number[]) || []);
    mutateFood();
  };

  const snoozeFood = async (foodId: number) => {
    const res = await editFood({
      foodId,
      action: "snooze",
    });
    if (res.error) {
      showToast(res.error.message || common.unexpected);
      return;
    }
    setSuggestedFoodIds((res.data as number[]) || []);
    mutateFood();
  };

  const startNewShopList = async () => {
    setSuggestedFoodIds([]);
    setIsStarting(true);
    const res = await startShopList({});
    setIsStarting(false);
    if (res.error) {
      showToast(res.error.message || common.unexpected);
    }
    if (!res.data) {
      return null;
    }
    setShopListId(res.data as number);
    return res.data as number;
  };

  const startShopClock = async () => {
    const res = await postShopClock({});
    if (res.error) {
      showToast(res.error.message || common.unexpected);
    }
  };

  const cancelShopList = async (discard = false) => {
    setSuggestedFoodIds([]);
    const res = await endShopList(discard ? { discard: true } : {});
    if (res.error) {
      showToast(res.error.message || common.unexpected);
    }
    return res.data as ShopListType;
  };

  return (
    <ShopListContext.Provider
      value={{
        foods,
        isFoodLoading,
        mutateFood,
        buyFood,
        snoozeFood,
        suggestedFoodIds,
        shopListId,
        startNewShopList,
        startShopClock,
        cancelShopList,
        orderFoodBy,
        reverseOrderFood,
        orderedBy,
        setShopListId,
      }}
    >
      {children}
    </ShopListContext.Provider>
  );
};

const useShopList = () => {
  const context = React.useContext(ShopListContext);
  if (context === undefined) {
    throw new Error("useShopList must be used within a ShopListProvider");
  }
  return context;
};

export default useShopList;
