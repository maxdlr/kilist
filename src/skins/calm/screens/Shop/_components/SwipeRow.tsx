import SwipeGesture from "@/components/gestures/SwipeGesture";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText, Dot } from "@/skins/calm/components";

const NUDGE = 150;

const NUDGE_PAUSE_MS = 900;

const SwipeRow = ({
  food,
  nudging = false,
  onBuy,
  onLater,
}: {
  food: FoodType;
  nudging?: boolean;
  onBuy: () => void;
  onLater: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const nudge = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (!nudging) {
      nudge.set(withTiming(0, AnimationService.config));
      return;
    }
    nudge.set(
      withRepeat(
        withSequence(
          withTiming(NUDGE, AnimationService.config),
          withTiming(0, AnimationService.config),
          withTiming(-NUDGE, AnimationService.config),
          withTiming(0, AnimationService.config),
          withDelay(NUDGE_PAUSE_MS, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );
  }, [nudging, nudge]);

  const nudgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: nudge.value }],
  }));
  const laterStyle = useAnimatedStyle(() => ({
    opacity: drag.value + nudge.value < 0 ? 1 : 0,
  }));

  return (
    <View
      accessible
      accessibilityLabel={`${food.name}, ${skin.copy.levels[level]}`}
      accessibilityHint={T.shop.hintAria}
      accessibilityActions={[
        { name: "activate", label: T.shop.inBasket },
        { name: "later", label: T.shop.nextTime },
      ]}
      onAccessibilityAction={(event) =>
        event.nativeEvent.actionName === "later" ? onLater() : onBuy()
      }
      style={styles.slot}
    >
      <View style={[styles.behind, styles.behindBuy]}>
        <CText weight="medium" size={skin.type.label + 1} color={C.onFill}>
          {T.shop.inBasket}
        </CText>
      </View>
      <Animated.View style={[styles.behind, styles.behindLater, laterStyle]}>
        <CText weight="medium" size={skin.type.label + 1} color={C.textSoft}>
          {T.shop.later}
        </CText>
      </Animated.View>
      <Animated.View style={nudgeStyle}>
        <SwipeGesture
          onSwipeRight={onBuy}
          onSwipeLeft={onLater}
          translation={drag}
          swipeThreshold={100}
          styles={{ box: styles.swipeBox }}
        >
          <View
            style={[styles.rowMain, { paddingHorizontal: skin.spacing.stack }]}
          >
            <CText
              size={skin.type.lead}
              style={[styles.flex]}
              numberOfLines={1}
            >
              {food.name}
            </CText>
            <Dot color={skin.colors.levels[level]} />
          </View>
        </SwipeGesture>
      </Animated.View>
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    rowMain: {
      alignItems: "center",
      flex: 1,
      flexDirection: "row",
      gap: s.spacing.dock - 2,
      minHeight: s.size.row.shop,
    },
    slot: {
      borderTopColor: C.line,
      borderTopWidth: s.shape.divider,
      overflow: "hidden",
    },
    behind: {
      alignItems: "center",
      bottom: 0,
      flexDirection: "row",
      left: 0,
      paddingHorizontal: s.spacing.stack,
      position: "absolute",
      right: 0,
      top: 0,
    },
    behindBuy: { backgroundColor: C.fill, justifyContent: "flex-start" },
    behindLater: { backgroundColor: C.tint, justifyContent: "flex-end" },
    swipeBox: { backgroundColor: C.ground },
  });

export default SwipeRow;
