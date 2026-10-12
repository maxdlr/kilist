import useAxios from "@/hooks/useAxios";
import { FoodType } from "@/types/model";
import React, { createContext, ReactNode, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";

export type FoodListContextType = {
  foods?: FoodType[];
  isFoodLoading: boolean;
  mutateFood: () => void;
  buyFood: (currentFoodId: number) => Promise<void>;
  snoozeFood: (foodId: number) => Promise<void>;
  suggestedFoodIds: number[];
};

const FoodListContext = createContext<FoodListContextType>({
  foods: [],
  isFoodLoading: false,
  mutateFood: () => {},
  buyFood: async () => {},
  snoozeFood: async () => {},
  suggestedFoodIds: [],
});

export const FoodListProvider = ({
  children,
  listIds,
}: {
  children: ReactNode;
  listIds?: number[];
}) => {
  const [buyingFoodId, setBuyingFoodId] = useState<number | null>(null);
  const {
    data: foods,
    isLoading: isFoodLoading,
    mutate: mutateFood,
  } = useSWR<FoodType[]>(
    {
      url: listIds ? "foods/browse" : null,
      params: {
        listIds,
        maxInStockScore: 1,
      },
    },
    {
      onSuccess: () => {},
      onError: () => {},
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      retryCount: 3,
      revalidateOnMount: true,
      loadingTimeout: 5000,
      // keepPreviousData: true,
    } as SWRConfiguration,
  );

  const { postData: buy } = useAxios("foods/buy");
  const { postData: snooze } = useAxios("foods/snooze");

  const [suggestedFoodIds, setSuggestedFoodIds] = useState<number[]>([]);

  const buyFood = async (currentFoodId: number) => {
    const res = await buy({ previousFoodId: buyingFoodId, currentFoodId });
    setBuyingFoodId(currentFoodId);
    setSuggestedFoodIds((res.data as number[]) || []);
    mutateFood();
  };

  const snoozeFood = async (foodId: number) => {
    const res = await snooze({ foodId });
    setSuggestedFoodIds((res.data as number[]) || []);
    mutateFood();
  };

  return (
    <FoodListContext.Provider
      value={{
        foods,
        isFoodLoading,
        mutateFood,
        buyFood,
        snoozeFood,
        suggestedFoodIds,
      }}
    >
      {children}
    </FoodListContext.Provider>
  );
};

const useFoodList = () => {
  const context = React.useContext(FoodListContext);
  if (context === undefined) {
    throw new Error("useFoodList must be used within a FoodListProvider");
  }
  return context;
};

export default useFoodList;
