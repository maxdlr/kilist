import Pill from "@/components/elements/Pill";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { FoodType } from "@/types/model";
import { inStockScoreToDisplay } from "@/utils/scoreUtils";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

const ShopFoodSuggestion = ({
  food,
  style,
  onBuy,
  onDismiss,
  onOptions,
  ref,
}: {
  food: FoodType;
  style?: StyleProp<ViewStyle>;
  onBuy: (foodId: number) => void;
  onDismiss?: (foodId: number) => void;
  onOptions?: (foodId: number) => void;
  ref?: React.RefObject<View | null>;
}) => {
  const theme = useTheme();

  const { id, name, inStockScore } = food;
  const display = inStockScoreToDisplay(inStockScore, theme);

  return (
    <ThemedView
      ref={ref}
      style={{
        ...styles.container,
        borderTopColor: display.color[80],
        backgroundColor: display.color[50],
        ...style,
      }}
    >
      <ThemedView style={{ ...styles.title }}>
        <ThemedText type="smallBold">Suggestion</ThemedText>
      </ThemedView>

      <SwipeGesture
        onSwipeRight={() => onBuy(id)}
        onSwipeLeft={() => onDismiss?.(id)}
        onLongPress={() => onOptions?.(id)}
        styles={{ box: { ...styles.item } }}
      >
        <ThemedText style={{ ...styles.name }}>{name}</ThemedText>
        <Pill label={display.label} />
      </SwipeGesture>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },

  title: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingTop: Spacing.two,
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.four,
  },

  name: {
    fontSize: 30,
    fontWeight: "bold",
    height: 30,
  },
});

export default ShopFoodSuggestion;
