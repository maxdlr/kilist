import SwipeFoods from "@/components/elements/SwipeFoods";
import { ThemedView } from "@/components/themed-view";
import { FoodType } from "@/types/model";
import useSWR from "swr";

const SwipeScreen = () => {
  const { data: foods, isLoading } = useSWR<FoodType[]>({
    url: "foods/browse",
    params: {
      limit: 10,
    },
  });

  const handleOnComplete = () => {
    console.log("Swipe complete");
  };

  if (isLoading) {
    return (
      <ThemedView>
        <ThemedView>Loading...</ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView>
      {foods && <SwipeFoods foods={foods} onComplete={handleOnComplete} />}
    </ThemedView>
  );
};

export default SwipeScreen;
