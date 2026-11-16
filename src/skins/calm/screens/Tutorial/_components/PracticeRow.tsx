import T from "@/skins/calm/text";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import AnimationService from "@/services/animation";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components";

const NUDGE = 180;

const NUDGE_MS = 1000;

const NUDGE_PAUSE_MS = 900;

const PracticeRow = ({
  name,
  nudging,
  nudgeTo = 1,
  onBuy,
  onLater,
}: {
  name: string;
  nudging: boolean;
  nudgeTo?: 1 | -1;
  onBuy: () => void;
  onLater: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const nudge = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (!nudging) {
      nudge.set(0);
      return;
    }
    nudge.set(
      withRepeat(
        withSequence(
          withDelay(NUDGE_PAUSE_MS, withTiming(NUDGE * nudgeTo, { duration: NUDGE_MS , easing: AnimationService.config.easing
          })),
          withTiming(0, { duration: NUDGE_MS , easing: AnimationService.config.easing
          }),
        ),
        -1,
      ),
    );
  }, [nudging, nudge, nudgeTo]);

  const nudgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: nudge.value }],
  }));
  const laterStyle = useAnimatedStyle(() => ({
    opacity: drag.value + nudge.value < 0 ? 1 : 0,
  }));

  return (
    <View
      accessible
      accessibilityLabel={name}
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
        <CText weight="medium" size={skin.type.label + 1} color={C.onPositive}>
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
          <View style={styles.rowMain}>
            <CText
              weight="bold"
              size={skin.type.lead}
              style={styles.flex}
              numberOfLines={1}
            >
              {name}
            </CText>
          </View>
        </SwipeGesture>
      </Animated.View>
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
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
    behindBuy: { backgroundColor: C.positive, justifyContent: "flex-start" },
    behindLater: { backgroundColor: C.tint, justifyContent: "flex-end" },
    swipeBox: { backgroundColor: C.ground },
    rowMain: {
      alignItems: "center",
      flexDirection: "row",
      minHeight: s.size.row.shop,
      paddingStart: s.spacing.stack,
    },
  });

export default PracticeRow;
