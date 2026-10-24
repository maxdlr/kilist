import useAxios from "@/hooks/useAxios";
import { FoodType, ShopListType } from "@/types/model";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";

export type ShopListContextType = {
  foods?: FoodType[];
  shopListId?: number;

  isFoodLoading: boolean;
  mutateFood: () => void;
  buyFood: (currentFoodId: number) => Promise<void>;
  startNewShopList: () => Promise<number | null>;
  cancelShopList: () => Promise<ShopListType>;
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
  cancelShopList: async () => ({}) as Promise<ShopListType>,
  snoozeFood: async () => {},
  suggestedFoodIds: [],
  reverseOrderFood: () => {},
  orderedBy: "score",
  setShopListId: () => {},
});

export const ShopListProvider = ({ children }: { children: ReactNode }) => {
  const [shopListId, setShopListId] = useState<number | undefined>();
  const [previousFoodId, setPreviousFoodId] = useState<number | undefined>();
  const [suggestedFoodIds, setSuggestedFoodIds] = useState<number[]>([]);
  const [orderedBy, setOrderedBy] = useState<"score" | "name">("score");

  const {
    data,
    isLoading: isFoodLoading,
    mutate: mutateFood,
  } = useSWR<ShopListType>(
    {
      url: shopListId ? `shop-list/${shopListId}` : null,
    },
    {
      onSuccess: () => {},
      onError: () => {},
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      retryCount: 3,
      revalidateOnMount: true,
      loadingTimeout: 5000,
      keepPreviousData: true,
    } as SWRConfiguration,
  );

  const [shopList, setShopList] = useState<ShopListType | undefined>(data);

  useEffect(() => {
    setShopList(data);
    orderFoodBy("score");
  }, [data]);

  const { postData: startShopList } = useAxios("shop-list/start");
  const { postData: endShopList } = useAxios(`shop-list/cancel/${shopListId}`);
  const { putData: editFood } = useAxios(`shop-list/edit/${shopListId}`);

  const orderFoodBy = (type: "score" | "name") => {
    setShopList((prev) => {
      if (!prev) return prev;
      const sortedFoods = [...prev.foods].sort((a, b) => {
        if (type === "name") {
          return a.name.localeCompare(b.name);
        }
        return (b.inStockScore || 0) - (a.inStockScore || 0);
      });

      return {
        ...prev,
        foods: type === "score" ? sortedFoods.reverse() : sortedFoods,
      };
    });
    setOrderedBy(type);
  };

  const reverseOrderFood = () => {
    setShopList((prev) => {
      if (!prev) return prev;
      const reversedFoods = [...prev.foods].reverse();
      return { ...prev, foods: reversedFoods };
    });
  };

  const buyFood = async (foodId: number) => {
    const res = await editFood({
      foodId: foodId,
      previousFoodId,
      action: "buy",
    });
    setPreviousFoodId(foodId);
    setSuggestedFoodIds((res.data as number[]) || []);
    mutateFood();
  };

  const snoozeFood = async (foodId: number) => {
    const res = await editFood({
      foodId,
      action: "snooze",
    });
    setSuggestedFoodIds((res.data as number[]) || []);
    mutateFood();
  };

  const startNewShopList = async () => {
    const res = await startShopList({});
    if (!res.data) {
      return null;
    }
    setShopListId(res.data as number);
    return res.data as number;
  };

  const cancelShopList = async () => {
    const res = await endShopList({});
    return res.data as ShopListType;
  };

  return (
    <ShopListContext.Provider
      value={{
        foods: shopList?.foods,
        isFoodLoading,
        mutateFood,
        buyFood,
        snoozeFood,
        suggestedFoodIds,
        shopListId,
        startNewShopList,
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
    throw new Error("useFoodList must be used within a FoodListProvider");
  }
  return context;
};

export default useShopList;
