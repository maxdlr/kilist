import SwipeFoods from "@/components/elements/SwipeFoods";
import TapGesture from "@/components/elements/TapGesture";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FoodType } from "@/types/model";
import { useState } from "react";
import { useTapGesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import useSWR from "swr";

const SwipeScreen = () => {
  const [isComplete, setIsComplete] = useState(false);

  const tap = useTapGesture({
    onActivate: () => {
      runOnJS(setIsComplete)(false);
    },
  });

  const {
    data: foods,
    isLoading,
    mutate,
  } = useSWR<FoodType[]>({
    url: "foods/browse",
    params: {
      take: 10,
      forSwipes: true,
    },
  });

  const handleOnComplete = async () => {
    await mutate();
    setIsComplete(true);
  };

  if (isLoading) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ThemedView>
          <ThemedText>Loading...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  if (isComplete) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ThemedView>
          <ThemedText>Swipe complete!</ThemedText>
          <TapGesture tap={tap} styles={{ root: {}, box: {} }}>
            <ThemedText>Again?</ThemedText>
          </TapGesture>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      {foods && <SwipeFoods foods={foods} onComplete={handleOnComplete} />}
    </ThemedView>
  );
};

export default SwipeScreen;
