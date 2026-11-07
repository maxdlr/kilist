import common from "@/i18n/common";
import axios from "@/services/axios";
import useAxios from "@/hooks/useAxios";
import useDebounce from "@/hooks/useDebounce";
import useToast from "@/providers/ToastProvider";
import { FoodType } from "@/types/model";
import React, { createContext, ReactNode, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";

export type FoodListContextType = {
  foods?: FoodType[];
  isFoodLoading: boolean;
  mutateFood: () => void;
  search: string;
  setSearch: (search: string) => void;
  createFood: (data: { name: string; description?: string }) => Promise<boolean>;
  editFood: (
    foodId: number,
    data: { name?: string; description?: string },
  ) => Promise<boolean>;
  removeFoodsFromList: (foodIds: number[]) => Promise<boolean>;
};

const FoodListContext = createContext<FoodListContextType>({
  foods: [],
  isFoodLoading: false,
  mutateFood: () => {},
  search: "",
  setSearch: () => {},
  createFood: async () => false,
  editFood: async () => false,
  removeFoodsFromList: async () => false,
});

export const FoodListProvider = ({
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
      onError: (err) => showToast(err?.message || common.unexpected),
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

  const createFood = async (data: { name: string; description?: string }) => {
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
    data: { name?: string; description?: string },
  ) => {
    try {
      await axios.put(`foods/edit/${foodId}`, data);
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
    <FoodListContext.Provider
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
