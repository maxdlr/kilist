import common from "@/i18n/common";
import axios from "@/services/axios";
import { useReportFeedback } from "@/providers/FeedbackStore";
import { problemOf } from "@/utils/problem";
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
import { isQuietError } from "@/services/fetcher";

export type SwipeGameType = {
  level: number;
  playedToday: boolean;
};

export type SwipeReward = {
  earned: number;
  bonus: number;
  balance: number | null;
};

export type SwipeRoundRecap = {
  day: string;
  added: FoodType[];
  kept: FoodType[];
  checking: boolean;
};

export type SwipeFoodsContextType = {
  roundRecap?: SwipeRoundRecap;
  setRoundRecap: (recap: SwipeRoundRecap) => void;
  game?: SwipeGameType;
  isGameLoading: boolean;
  mutateGame: () => void;
  foods?: FoodType[];
  swipes?: FoodType[];
  foodsCount: number;
  swipe: (foodId: number) => void;
  unswipe: (food: FoodType) => void;
  isLoading: boolean;
  mutateFoods: () => void;
  update: (payload: {
    foodId: number;
    isInStock: boolean | null;
    replay?: boolean;
  }) => Promise<SwipeReward | null>;
  loadDeck: (mode: "replay" | "again") => Promise<number>;
  rememberDeck: (ids: number[]) => void;
  completeSession: () => Promise<void>;
  freezeDeck: (frozen: boolean) => void;
};

const SwipeFoodsContext = createContext<SwipeFoodsContextType>({
  roundRecap: undefined,
  setRoundRecap: () => {},
  game: undefined,
  isGameLoading: false,
  mutateGame: () => {},
  foods: undefined,
  swipes: undefined,
  foodsCount: 0,
  swipe: () => {},
  unswipe: () => {},
  isLoading: false,
  mutateFoods: () => {},
  update: async () => null,
  loadDeck: async () => 0,
  rememberDeck: () => {},
  completeSession: async () => {},
  freezeDeck: () => {},
});

export const SwipeFoodsProvider = ({ children }: { children: ReactNode }) => {
  const report = useReportFeedback();
  const [roundRecap, setRoundRecap] = useState<SwipeRoundRecap>();

  const {
    data,
    isLoading,
    mutate: mutateFoods,
  } = useSWR<FoodType[]>(
    {
      url: "foods/swipe/browse",
    },
    {
      onSuccess: () => report("play", null),
      onError: (err) =>
        !isQuietError(err) &&
        report("play", {
          tone: "error",
          title: common.feedback.load.game,
          body: err?.message || common.feedback.loadLine,
          action: { label: common.feedback.retry, onPress: () => mutateFoods() },
        }),
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

  const lastDeck = useRef<number[]>([]);

  const rememberDeck = useCallback((ids: number[]) => {
    lastDeck.current = ids;
  }, []);

  const loadDeck = async (mode: "replay" | "again") => {
    try {
      const params = mode === "replay" ? { replay: 1, ids: lastDeck.current.join(",") } : { again: 1 };
      const { data: deck } = await axios.get<FoodType[]>("foods/swipe/browse", { params });
      if (mode === "again") lastDeck.current = (deck ?? []).map((food) => food.id);
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
      report("play", null);
      return res.data ?? null;
    } catch (err) {
      report("play", { tone: "error", title: common.feedback.answerLost, body: problemOf(err).message });
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
    } catch (err) {
      report("play", { tone: "error", title: common.feedback.saveFailed, body: problemOf(err).message });
    }
  };

  const swipe = (foodId: number) => {
    swipedIds.current.add(foodId);
    setFoods((prevFoods) => prevFoods?.filter((food) => food.id !== foodId));
  };

  const unswipe = (food: FoodType) => {
    swipedIds.current.delete(food.id);
    setFoods((prevFoods) => [food, ...(prevFoods ?? []).filter((entry) => entry.id !== food.id)]);
  };

  const foodsCount = useMemo(() => data?.length || 0, [data]);

  const swipes = useMemo(() => foods?.slice(0, 3), [foods]);

  return (
    <SwipeFoodsContext.Provider
      value={{
        roundRecap,
        setRoundRecap,
        game,
        isGameLoading,
        mutateGame,
        foods,
        swipes,
        foodsCount,
        swipe,
        unswipe,
        isLoading,
        mutateFoods,
        update,
        loadDeck,
        rememberDeck,
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
