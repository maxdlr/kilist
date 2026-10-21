import Pill from "@/components/elements/Pill";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import useShopList from "@/providers/ShopListProvider";
import { FoodType } from "@/types/model";
import {
  calculateValueFromInStockScore,
  inStockScoreToDisplay,
} from "@/utils/scoreUtils";
import { useState } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import ShopListFoodRowSwipeBg from "./ShopListFoodRowSwipeBg";

const ShopListFoodRow = ({
  food,
  style,
  onBuy,
  onDismiss,
  onOptions,
}: {
  food: FoodType;
  style?: StyleProp<ViewStyle>;
  onBuy: (foodId: number) => void;
  onDismiss?: (foodId: number) => void;
  onOptions?: (foodId: number) => void;
}) => {
  const [isSwipingRight, setIsSwipingRight] = useState<boolean>();
  const { id, name, inStockScore } = food;
  const { foods } = useShopList();
  const theme = useTheme();
  const display = inStockScoreToDisplay(inStockScore, theme);

  return (
    <ThemedView style={styles.container}>
      <ShopListFoodRowSwipeBg buying={isSwipingRight} />

      <SwipeGesture
        onSwipeRight={() => onBuy(id)}
        onSwipeLeft={() => onDismiss?.(id)}
        onLongPress={() => onOptions?.(id)}
        onSwipingRight={() => setIsSwipingRight(true)}
        onSwipingLeft={() => setIsSwipingRight(false)}
        styles={{
          box: {
            paddingVertical: calculateValueFromInStockScore(
              inStockScore,
              foods,
              Spacing.two,
              Spacing.six,
            ),
            borderBottomColor: display.color[80],
            backgroundColor: display.color[50],
            borderBottomWidth: 1,
            ...styles.item,
            ...style,
          },
        }}
      >
        <ThemedText
          style={{
            ...styles.name,
            color: display.color[90],
            fontSize: calculateValueFromInStockScore(
              inStockScore,
              foods,
              20,
              26,
            ),
          }}
        >
          {name}
        </ThemedText>

        <Pill
          label={display.label}
          color={display.color[60]}
          style={{ color: display.color[90] }}
        />
      </SwipeGesture>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },

  background: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
  },

  item: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
  },

  loading: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  name: {
    fontSize: 26,
    fontWeight: "bold",
    height: 26,
  },
});

export default ShopListFoodRow;
