import EmptyData from "@/components/elements/EmptyData";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import TapGesture from "@/components/gestures/TapGesture";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import useSwipeFoods from "@/providers/SwipeFoodsProvider";
import { useState } from "react";
import { useTapGesture } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import SwipeFoods from "../SwipeFoods";
import KilButton from "@/components/elements/KilButton";
import { Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";

export interface FoodHistoryCreateType {
  foodId: number;
  isInStock: boolean;
}

const SwipeFoodGame = () => {
  const [isComplete, setIsComplete] = useState(false);
  const { swipes, foods, isLoading, mutateFoods, foodsCount } = useSwipeFoods();

  // const tap = useTapGesture({
  //   onActivate: () => {
  //     scheduleOnRN(setIsComplete, false);
  //     scheduleOnRN(mutateFoods);
  //   },
  // });

  const handleOnComplete = async () => {
    setIsComplete(true);
  };

  const handleStartAgain = () => {
    setIsComplete(false);
    return mutateFoods();
  };

  if (isLoading) {
    return <LoadingAnim centered />;
  }

  if (isComplete) {
    return (
      <ThemedView style={{ ...styles.container }}>
        <ThemedText type="title" style={{ textAlign: "center" }}>
          Swipe complete!
        </ThemedText>
        <KilButton onTouch={handleStartAgain} label="Again ?" />
      </ThemedView>
    );
  }

  if (!swipes || swipes.length === 0) {
    return (
      <EmptyData label="No foods available" onRefresh={handleStartAgain} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.six,
    gap: Spacing.four,
  },
});

export default SwipeFoodGame;
