import common from "@/i18n/common";
import axios from "@/services/axios";
import useAxios from "@/hooks/useAxios";
import useDebounce from "@/hooks/useDebounce";
import useToast from "@/providers/ToastProvider";
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
  createFood: (data: { name: string; product?: ScannedProduct; frequencyDays?: number | null }) => Promise<boolean>;
  editFood: (
    foodId: number,
    data: { name?: string; level?: LevelNumber; frequencyDays?: number | null },
  ) => Promise<boolean>;
  removeFoodsFromList: (foodIds: number[]) => Promise<boolean>;
};

const InventoryContext = createContext<InventoryContextType>({
  foods: [],
  isFoodLoading: false,
  mutateFood: () => {},
  search: "",
  setSearch: () => {},
  createFood: async () => false,
  editFood: async () => false,
  removeFoodsFromList: async () => false,
});

export const InventoryProvider = ({
  children,
  listIds,
}: {
  children: ReactNode;
  listIds?: number[];
}) => {
  const { showToast } = useToast();
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
      onSuccess: () => {},
      onError: (err) => !isQuietError(err) && showToast(err?.message || common.unexpected),
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

  const handleError = (message?: string) => {
    showToast(message || common.unexpected);
  };

  const createFood = async (data: { name: string; product?: ScannedProduct; frequencyDays?: number | null }) => {
    const res = await postCreateFood({ ...data, listId: listIds?.[0] });
    if (res.error) {
      handleError(res.error.message);
      return false;
    }
    mutateFood();
    return true;
  };

  const editFood = async (
    foodId: number,
    { level, ...data }: { name?: string; level?: LevelNumber; frequencyDays?: number | null },
  ) => {
    try {
      await axios.put(`foods/edit/${foodId}`, data);
      if (level !== undefined) await putFoodLevel(foodId, level);
      mutateFood();
      return true;
    } catch (err: any) {
      handleError(err?.response?.data?.message);
      return false;
    }
  };

  const removeFoodsFromList = async (foodIds: number[]) => {
    const res = await putRemoveFoods({ foodIds });
    if (res.error) {
      handleError(res.error.message);
      return false;
    }
    mutateFood();
    return true;
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
