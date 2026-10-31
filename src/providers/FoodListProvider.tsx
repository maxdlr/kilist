import { FoodType } from "@/types/model";
import React, { createContext, ReactNode } from "react";
import useSWR, { SWRConfiguration } from "swr";

export type FoodListContextType = {
  foods?: FoodType[];
  isFoodLoading: boolean;
  mutateFood: () => void;
};

const FoodListContext = createContext<FoodListContextType>({
  foods: [],
  isFoodLoading: false,
  mutateFood: () => {},
});

export const FoodListProvider = ({
  children,
  listIds,
}: {
  children: ReactNode;
  listIds?: number[];
}) => {
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
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      retryCount: 3,
      revalidateOnMount: true,
      loadingTimeout: 5000,
      // keepPreviousData: true,
    } as SWRConfiguration,
  );

  return (
    <FoodListContext.Provider
      value={{
        foods,
        isFoodLoading,
        mutateFood,
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
