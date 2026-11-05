import type { Skin } from "@/skins/types";
import FoodIcon from "@/components/elements/FoodIcon";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

const ShopListFoodRow = ({
  food,
  onBuy,
  onDismiss,
}: {
  food: FoodType;
  onBuy: (foodId: number) => void;
  onDismiss?: (foodId: number) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.shop;
  const [isBuying, setIsBuying] = useState(true);
  const { id, name, inStockScore, icon } = food;
  const level = levelOf(inStockScore);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isBuying
            ? skin.actions.primary.fill
            : skin.colors.ground,
        },
      ]}
    >
      <View
        style={[
          styles.behind,
          { justifyContent: isBuying ? "flex-start" : "flex-end" },
        ]}
      >
        <ThemedText
          size={skin.type.headline}
          color={isBuying ? skin.actions.primary.ink : skin.colors.danger}
        >
          {isBuying ? copy.bought : copy.later}
        </ThemedText>
      </View>

      <SwipeGesture
        onSwipeRight={() => onBuy(id)}
        onSwipeLeft={() => onDismiss?.(id)}
        onSwipingRight={() => setIsBuying(true)}
        onSwipingLeft={() => setIsBuying(false)}
        swipeThreshold={100}
        styles={{
          box: [
            styles.row,
            {
              backgroundColor: skin.colors.levels[level],
              borderBottomColor: skin.colors.ground,
            },
          ],
        }}
      >
        <FoodIcon name={icon} size={skin.size.icon.row} />
        <ThemedText
          numberOfLines={1}
          size={skin.type.title}
          color={skin.colors.onLevel}
          style={styles.name}
        >
          {name.toUpperCase()}
        </ThemedText>
        <ThemedText size={skin.type.caption} color={skin.colors.onLevel}>
          {skin.copy.levels[level]}
        </ThemedText>
      </SwipeGesture>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    container: {
      height: s.size.row.shop,
    },
    behind: {
      alignItems: "center",
      bottom: 0,
      flexDirection: "row",
      left: 0,
      paddingHorizontal: s.spacing.gutter,
      position: "absolute",
      right: 0,
      top: 0,
    },
    row: {
      alignItems: "center",
      borderBottomWidth: s.shape.divider,
      flexDirection: "row",
      gap: s.spacing.inline,
      height: s.size.row.shop,
      paddingLeft: s.spacing.inline,
      paddingRight: s.spacing.gutter,
    },
    name: {
      flex: 1,
    },
  });

export default ShopListFoodRow;
