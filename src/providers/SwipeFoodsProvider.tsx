import axios from "@/services/axios";
import useToast from "@/providers/ToastProvider";
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
  update: (payload: {
    foodId: number;
    isInStock: boolean | null;
  }) => Promise<void>;
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
  const { showToast } = useToast();

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
      onError: (err) => showToast(err?.message || "An unexpected error occurred"),
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

  const update = async (payload: {
    foodId: number;
    isInStock: boolean | null;
  }) => {
    try {
      await axios.put(`foods/swipe/edit/${payload.foodId}`, payload);
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || "An unexpected error occurred",
      );
    }
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
