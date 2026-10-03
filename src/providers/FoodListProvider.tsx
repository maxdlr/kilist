import useAxios from "@/hooks/useAxios";
import { KRes } from "@/types/api";
import { FoodType } from "@/types/model";
import React, { createContext, ReactNode, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";

export type FoodListContextType = {
  foods?: FoodType[];
  isFoodLoading: boolean;
  mutateFood: () => void;
  buyFood: (currentFoodId: number) => Promise<void>;
  suggestedFoodIds: number[];
};

const FoodListContext = createContext<FoodListContextType>({
  foods: [],
  isFoodLoading: false,
  mutateFood: () => {},
  buyFood: async () => {},
  suggestedFoodIds: [],
});

export const FoodListProvider = ({
  children,
  listIds,
}: {
  children: ReactNode;
  listIds: number[];
}) => {
  const {
    data: foods,
    isLoading: isFoodLoading,
    mutate: mutateFood,
  } = useSWR<FoodType[]>(
    {
      url: "foods/browse",
      params: {
        listIds,
      },
    },
    {
      // onSuccess: () => setLoading(false),
      // onError: () => setLoading(false),
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      retryCount: 3,
      revalidateOnMount: true,
      loadingTimeout: 5000,
      keepPreviousData: true,
    } as SWRConfiguration,
  );

  const { postData } = useAxios("foods/buy");

  const [previousFoodId, setPreviousFoodId] = useState<number | undefined>(
    undefined,
  );

  const [suggestedFoodIds, setSuggestedFoodIds] = useState<number[]>([]);

  const buyFood = async (currentFoodId: number) => {
    const res = await postData({ previousFoodId, currentFoodId });
    setPreviousFoodId(currentFoodId);
    setSuggestedFoodIds((res.data as number[]) || []);
    mutateFood();
  };

  return (
    <FoodListContext.Provider
      value={{ foods, isFoodLoading, mutateFood, buyFood, suggestedFoodIds }}
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
