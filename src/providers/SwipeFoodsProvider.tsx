import axios from "@/services/axios";
import { FoodType } from "@/types/model";
import React, {
  createContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import useSWR, { SWRConfiguration } from "swr";

export type SwipeFoodsContextType = {
  foods?: FoodType[];
  foodsCount: number;
  swipe: (foodId: number) => void;
  isLoading: boolean;
  mutateFoods: () => void;
  update: (payload: { foodId: number; isInStock: boolean }) => Promise<void>;
};

const SwipeFoodsContext = createContext<SwipeFoodsContextType>({
  foods: undefined,
  foodsCount: 0,
  swipe: () => {},
  isLoading: false,
  mutateFoods: () => {},
  update: async () => {},
});

export const SwipeFoodsProvider = ({ children }: { children: ReactNode }) => {
  const {
    data,
    isLoading,
    mutate: mutateFoods,
  } = useSWR<FoodType[]>(
    {
      url: "foods/swipe/browse",
    },
    {
      onSuccess: () => {},
      onError: () => {},
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      retryCount: 3,
      revalidateOnMount: true,
      loadingTimeout: 5000,
      keepPreviousData: false,
    } as SWRConfiguration,
  );

  const [foods, setFoods] = useState<FoodType[] | undefined>(data);

  useEffect(() => setFoods(data), [data]);

  const update = async (payload: { foodId: number; isInStock: boolean }) => {
    await axios.put(`foods/swipe/edit/${payload.foodId}`, payload);
  };

  const swipe = (foodId: number) => {
    setFoods((prevFoods) => prevFoods?.filter((food) => food.id !== foodId));
  };

  const foodsCount = useMemo(() => data?.length || 0, [data]);

  return (
    <SwipeFoodsContext.Provider
      value={{
        foods,
        foodsCount,
        swipe,
        isLoading,
        mutateFoods,
        update,
      }}
    >
      {children}
    </SwipeFoodsContext.Provider>
  );
};

const useSwipeFoods = () => {
  const context = React.useContext(SwipeFoodsContext);
  if (context === undefined) {
    throw new Error("useSwipeFoods must be used within a FoodListProvider");
  }
  return context;
};

export default useSwipeFoods;
