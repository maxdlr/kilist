import TapGesture from "@/components/gestures/TapGesture";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import useSwipeFoods from "@/providers/SwipeFoodsProvider";
import { useState } from "react";
import { useTapGesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import SwipeFoods from "../SwipeFoods";

export interface FoodHistoryCreateType {
  foodId: number;
  isInStock: boolean;
}

const SwipeFoodGame = () => {
  const [isComplete, setIsComplete] = useState(false);
  const { swipes, foods, isLoading, mutateFoods, foodsCount } = useSwipeFoods();

  const tap = useTapGesture({
    onActivate: () => {
      scheduleOnRN(setIsComplete, false);
      scheduleOnRN(mutateFoods);
    },
  });

  const handleOnComplete = async () => {
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

  if (!swipes || swipes.length === 0) {
    return (
      <ThemedView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ThemedView>
          <ThemedText>No foods available</ThemedText>
          <TapGesture tap={tap} styles={{ root: {}, box: {} }}>
            <ThemedText>Refresh</ThemedText>
          </TapGesture>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={{
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: swipes.length * 30,
      }}
    >
      <SwipeFoods foods={swipes} onComplete={handleOnComplete} />
    </ThemedView>
  );
};

export default SwipeFoodGame;
