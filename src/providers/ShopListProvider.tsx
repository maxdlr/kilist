import useAxios from "@/hooks/useAxios";
import { FoodType, ShopListType } from "@/types/model";
import React, { createContext, ReactNode, useMemo, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";

export type ShopListContextType = {
  foods?: FoodType[];
  shopList?: ShopListType;

  isFoodLoading: boolean;
  mutateFood: () => void;
  buyFood: (currentFoodId: number) => Promise<void>;
  startNewShopList: () => Promise<ShopListType>;
  endCurrentShopList: () => Promise<ShopListType>;
  snoozeFood: (foodId: number) => Promise<void>;
  suggestedFoodIds: number[];
};

const ShopListContext = createContext<ShopListContextType>({
  foods: [],
  shopList: undefined,

  isFoodLoading: false,
  mutateFood: () => {},
  buyFood: async () => {},
  startNewShopList: async () => ({}) as Promise<ShopListType>,
  endCurrentShopList: async () => ({}) as Promise<ShopListType>,
  snoozeFood: async () => {},
  suggestedFoodIds: [],
});

export const ShopListProvider = ({
  children,
}: {
  children: ReactNode;
  listIds?: number[];
}) => {
  const [shopList, setShopList] = useState<ShopListType | undefined>(undefined);
  const [previousFoodId, setPreviousFoodId] = useState<number | null>(null);
  const {
    data: shop,
    isLoading: isFoodLoading,
    mutate: mutateFood,
  } = useSWR<ShopListType>(
    {
      url: shopList?.id ? `shop-list/${shopList?.id}` : null,
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
  const { postData: endShopList } = useAxios(
    `shop-list/end?shopList=${shopList?.id}`,
  );
  const { putData: editFood } = useAxios(
    `shop-list/edit?shopListId=${shopList?.id}`,
  );

  const [suggestedFoodIds, setSuggestedFoodIds] = useState<number[]>([]);

  const foods = useMemo(() => {
    if (!shop) return [];
    console.log(shop.startFoods.length, shop.boughtFoods.length);

    return shop.startFoods.filter((food) => {
      return (
        !shop.boughtFoods.map((f) => f.id).includes(food.id) &&
        new Date(food.snoozedUntil || 0) < new Date()
      );
    });
  }, [shop]);

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
    setShopList(res.data as ShopListType);
    return res.data as ShopListType;
  };

  const endCurrentShopList = async () => {
    const res = await endShopList({});
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
        shopList,
        startNewShopList,
        endCurrentShopList,
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
