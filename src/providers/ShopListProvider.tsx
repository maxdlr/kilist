import useAxios from "@/hooks/useAxios";
import { FoodType, ShopListType } from "@/types/model";
import React, { createContext, ReactNode, useMemo, useState } from "react";
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
};

const ShopListContext = createContext<ShopListContextType>({
  foods: [],
  shopListId: undefined,

  isFoodLoading: false,
  mutateFood: () => {},
  buyFood: async () => {},
  startNewShopList: async () => null,
  cancelShopList: async () => ({}) as Promise<ShopListType>,
  snoozeFood: async () => {},
  suggestedFoodIds: [],
});

export const ShopListProvider = ({ children }: { children: ReactNode }) => {
  const [shopListId, setShopListId] = useState<number | undefined>();
  const [previousFoodId, setPreviousFoodId] = useState<number | undefined>();
  const [suggestedFoodIds, setSuggestedFoodIds] = useState<number[]>([]);

  const {
    data: shopList,
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

  const { postData: startShopList } = useAxios("shop-list/start");
  const { postData: endShopList } = useAxios(`shop-list/cancel/${shopListId}`);
  const { putData: editFood } = useAxios(`shop-list/edit/${shopListId}`);

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
