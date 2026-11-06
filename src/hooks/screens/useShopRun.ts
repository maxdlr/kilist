import useShopList from "@/providers/ShopListProvider";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

const useShopRun = () => {
  const shop = useShopList();
  const { shopListId, startNewShopList, cancelShopList, setShopListId } = shop;
  const [handled, setHandled] = useState(0);
  const [bought, setBought] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!shopListId) startNewShopList();
    }, [shopListId]),
  );

  const buy = (foodId: number) => {
    setHandled((count) => count + 1);
    setBought((count) => count + 1);
    return shop.buyFood(foodId);
  };

  const snooze = (foodId: number) => {
    setHandled((count) => count + 1);
    return shop.snoozeFood(foodId);
  };

  const refreshEmpty = async () => {
    const id = await startNewShopList();
    if (id === shopListId) await shop.mutateFood();
  };

  const stop = async () => {
    await cancelShopList();
    router.navigate("/");
    setShopListId(undefined);
    setHandled(0);
    setBought(0);
  };

  const foods = shop.foods;
  const suggestion = foods?.find((food) => food.id === shop.suggestedFoodIds[0]);

  return {
    ...shop,
    isLoading: shop.isFoodLoading && foods === undefined,
    isFinished: (!foods || foods.length === 0) && handled > 0,
    isEmpty: (!foods || foods.length === 0) && handled === 0,
    handled,
    bought,
    suggestion,
    rows: foods?.filter((food) => food.id !== suggestion?.id) ?? [],
    buy,
    snooze,
    stop,
    refreshEmpty,
  };
};

export default useShopRun;
