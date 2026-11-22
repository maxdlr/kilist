import common from "@/i18n/common";
import axios from "@/services/axios";
import useAxios from "@/hooks/useAxios";
import useDebounce from "@/hooks/useDebounce";
import { useReportFeedback } from "@/providers/FeedbackStore";
import { problemOf, type Problem } from "@/utils/problem";
import type { ScannedProduct } from "@/offline/domain";
import type { LevelNumber } from "@/skins/types";
import { FoodType } from "@/types/model";
import { putFoodLevel } from "@/utils/foodLevel";
import React, { createContext, ReactNode, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";
import { isQuietError } from "@/services/fetcher";

export type InventoryContextType = {
  foods?: FoodType[];
  isFoodLoading: boolean;
  mutateFood: () => void;
  search: string;
  setSearch: (search: string) => void;
  createFood: (data: { name: string; product?: ScannedProduct } & FoodDetails) => Promise<Problem | null>;
  editFood: (foodId: number, data: { name?: string; level?: LevelNumber } & FoodDetails) => Promise<Problem | null>;
  removeFoodsFromList: (foodIds: number[]) => Promise<Problem | null>;
};

type FoodDetails = {
  frequencyDays?: number | null;
  quantity?: string | null;
  note?: string | null;
  aisle?: string;
};

const InventoryContext = createContext<InventoryContextType>({
  foods: [],
  isFoodLoading: false,
  mutateFood: () => {},
  search: "",
  setSearch: () => {},
  createFood: async () => null,
  editFood: async () => null,
  removeFoodsFromList: async () => null,
});

export const InventoryProvider = ({
  children,
  listIds,
}: {
  children: ReactNode;
  listIds?: number[];
}) => {
  const report = useReportFeedback();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const {
    data: foods,
    isLoading: isFoodLoading,
    mutate: mutateFood,
  } = useSWR<FoodType[]>(
    {
      url: listIds ? "foods/browse" : null,
      params: {
        listIds,
        search: debouncedSearch || undefined,
      },
    },
    {
      onSuccess: () => report("inventory", null),
      onError: (err) =>
        !isQuietError(err) &&
        report("inventory", {
          tone: "error",
          title: common.feedback.load.inventory,
          body: err?.message || common.feedback.loadLine,
          action: { label: common.feedback.retry, onPress: () => mutateFood() },
        }),
      revalidateOnFocus: true,
      revalidateIfStale: true,
      revalidateOnReconnect: true,
      retryCount: 3,
      revalidateOnMount: true,
      loadingTimeout: 5000,
      keepPreviousData: true,
    } as SWRConfiguration,
  );

  const { postData: postCreateFood } = useAxios("foods/create");
  const { putData: putRemoveFoods } = useAxios(
    listIds?.[0] ? `lists/${listIds[0]}/remove-foods` : "",
  );

  const createFood = async (data: { name: string; product?: ScannedProduct } & FoodDetails) => {
    const res = await postCreateFood({ ...data, listId: listIds?.[0] });
    if (res.error) return problemOf(res.error);
    mutateFood();
    return null;
  };

  const editFood = async (
    foodId: number,
    { level, ...data }: { name?: string; level?: LevelNumber } & FoodDetails,
  ) => {
    try {
      await axios.put(`foods/edit/${foodId}`, data);
      if (level !== undefined) await putFoodLevel(foodId, level);
      mutateFood();
      return null;
    } catch (err) {
      return problemOf(err);
    }
  };

  const removeFoodsFromList = async (foodIds: number[]) => {
    const res = await putRemoveFoods({ foodIds });
    if (res.error) return problemOf(res.error);
    mutateFood();
    return null;
  };

  return (
    <InventoryContext.Provider
      value={{
        foods,
        isFoodLoading,
        mutateFood,
        search,
        setSearch,
        createFood,
        editFood,
        removeFoodsFromList,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

const useInventory = () => {
  const context = React.useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within a InventoryProvider");
  }
  return context;
};

export default useInventory;
