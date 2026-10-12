import useAxios from "@/hooks/useAxios";
import { FoodType, SessionType } from "@/types/model";
import React, { createContext, ReactNode, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";

export type ShopContextType = {
  foods?: FoodType[];
  session?: SessionType;

  isFoodLoading: boolean;
  mutateFood: () => void;
  buyFood: (currentFoodId: number) => Promise<void>;
  startNewSession: () => Promise<SessionType>;
  snoozeFood: (foodId: number) => Promise<void>;
  suggestedFoodIds: number[];
};

const ShopContext = createContext<ShopContextType>({
  foods: [],
  session: undefined,

  isFoodLoading: false,
  mutateFood: () => {},
  buyFood: async () => {},
  startNewSession: async () => ({}) as Promise<SessionType>,
  snoozeFood: async () => {},
  suggestedFoodIds: [],
});

export const ShopProvider = ({
  children,
}: {
  children: ReactNode;
  listIds?: number[];
}) => {
  const [session, setSession] = useState<SessionType | undefined>(undefined);
  const [buyingFoodId, setBuyingFoodId] = useState<number | null>(null);
  const {
    data: foods,
    isLoading: isFoodLoading,
    mutate: mutateFood,
  } = useSWR<FoodType[]>(
    {
      url: session ? "shop/foods" : null,
      params: { sessionId: session?.id },
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

  // const [foods, setFoods] = useState<FoodType[]>(shop?.foods || []);

  const { postData: startSession } = useAxios("shop/session/start");
  const { postData: buy } = useAxios("shop/buy");
  const { postData: snooze } = useAxios("shop/snooze");

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

  const startNewSession = async () => {
    const res = await startSession({});
    setSession(res.data as SessionType);
    return res.data as SessionType;
  };

  return (
    <ShopContext.Provider
      value={{
        foods,
        isFoodLoading,
        mutateFood,
        buyFood,
        snoozeFood,
        suggestedFoodIds,
        session,
        startNewSession,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

const useShop = () => {
  const context = React.useContext(ShopContext);
  if (context === undefined) {
    throw new Error("useFoodList must be used within a FoodListProvider");
  }
  return context;
};

export default useShop;
