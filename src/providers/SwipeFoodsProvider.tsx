import common from "@/i18n/common";
import axios from "@/services/axios";
import useToast from "@/providers/ToastProvider";
import { FoodType } from "@/types/model";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import useSWR, { SWRConfiguration } from "swr";

export type SwipeGameType = {
  level: number;
  playedToday: boolean;
};

export type SwipeReward = {
  earned: number;
  bonus: number;
  balance: number | null;
};

export type SwipeFoodsContextType = {
  game?: SwipeGameType;
  isGameLoading: boolean;
  mutateGame: () => void;
  foods?: FoodType[];
  swipes?: FoodType[];
  foodsCount: number;
  swipe: (foodId: number) => void;
  isLoading: boolean;
  mutateFoods: () => void;
  update: (payload: {
    foodId: number;
    isInStock: boolean | null;
    replay?: boolean;
  }) => Promise<SwipeReward | null>;
  loadReplay: () => Promise<number>;
  completeSession: () => Promise<void>;
  freezeDeck: (frozen: boolean) => void;
};

const SwipeFoodsContext = createContext<SwipeFoodsContextType>({
  game: undefined,
  isGameLoading: false,
  mutateGame: () => {},
  foods: undefined,
  swipes: undefined,
  foodsCount: 0,
  swipe: () => {},
  isLoading: false,
  mutateFoods: () => {},
  update: async () => null,
  loadReplay: async () => 0,
  completeSession: async () => {},
  freezeDeck: () => {},
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
      onError: (err) =>
        showToast(err?.message || common.unexpected),
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      retryCount: 3,
      revalidateOnMount: true,
      loadingTimeout: 5000,
      keepPreviousData: false,
    } as SWRConfiguration,
  );

  const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);

  const {
    data: game,
    isLoading: isGameLoading,
    mutate: mutateGame,
  } = useSWR<SwipeGameType>({
    url: "swipe-list/game",
    params: { tzOffset },
  });

  const [foods, setFoods] = useState<FoodType[] | undefined>(data);
  const swipedIds = useRef(new Set<number>());
  const deckFrozen = useRef(false);
  const latestData = useRef(data);

  useEffect(() => {
    latestData.current = data;
    if (deckFrozen.current) return;
    setFoods(data?.filter((food) => !swipedIds.current.has(food.id)));
  }, [data]);

  const freezeDeck = useCallback((frozen: boolean) => {
    deckFrozen.current = frozen;
    if (!frozen) {
      setFoods(latestData.current?.filter((food) => !swipedIds.current.has(food.id)));
    }
  }, []);

  const loadReplay = async () => {
    try {
      const { data: deck } = await axios.get<FoodType[]>("foods/swipe/browse", { params: { replay: 1 } });
      swipedIds.current.clear();
      deckFrozen.current = true;
      setFoods(deck ?? []);
      return deck?.length ?? 0;
    } catch {
      return 0;
    }
  };

  const update = async (payload: {
    foodId: number;
    isInStock: boolean | null;
    replay?: boolean;
  }) => {
    try {
      const res = await axios.put<SwipeReward>(
        `foods/swipe/edit/${payload.foodId}`,
        payload,
      );
      return res.data ?? null;
    } catch (err: any) {
      showToast(err?.response?.data?.message || common.unexpected);
      return null;
    } finally {
      swipedIds.current.delete(payload.foodId);
    }
  };

  const completeSession = async () => {
    try {
      const res = await axios.post<SwipeGameType>("swipe-list/complete", {
        tzOffset,
      });
      await mutateGame(res.data, { revalidate: false });
    } catch (err: any) {
      showToast(err?.response?.data?.message || common.unexpected);
    }
  };

  const swipe = (foodId: number) => {
    swipedIds.current.add(foodId);
    setFoods((prevFoods) => prevFoods?.filter((food) => food.id !== foodId));
  };

  const foodsCount = useMemo(() => data?.length || 0, [data]);

  const swipes = useMemo(() => foods?.slice(0, 3), [foods]);

  return (
    <SwipeFoodsContext.Provider
      value={{
        game,
        isGameLoading,
        mutateGame,
        foods,
        swipes,
        foodsCount,
        swipe,
        isLoading,
        mutateFoods,
        update,
        loadReplay,
        completeSession,
        freezeDeck,
      }}
    >
      {children}
    </SwipeFoodsContext.Provider>
  );
};

const useSwipeFoods = () => {
  const context = React.useContext(SwipeFoodsContext);
  if (context === undefined) {
    throw new Error("useSwipeFoods must be used within a SwipeFoodsProvider");
  }
  return context;
};

export default useSwipeFoods;
