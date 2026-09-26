import { FoodType } from "@/types/model";
import React, { createContext, ReactNode } from "react";
import useSWR from "swr";

export type FoodListContextType = {
  foods?: FoodType[];
  isFoodLoading?: boolean;
  mutateFood?: () => void;
};

const FoodListContext = createContext<FoodListContextType>({});

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
  } = useSWR<FoodType[]>({
    url: "foods/browse",
    params: {
      listIds,
    },
  });

  return (
    <FoodListContext.Provider value={{ foods, isFoodLoading, mutateFood }}>
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
