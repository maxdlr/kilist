import T from "@/skins/calm/text";
import SwipeGesture from "@/components/gestures/SwipeGesture";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import AnimationService from "@/services/animation";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ARM, SwipeUnder } from "@/skins/calm/screens/Shop/_components/ShopRow";
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
  const moved = useDerivedValue(() => drag.value + nudge.value);

  return (
    <View
      accessible
      accessibilityLabel={name}
      accessibilityActions={[
        { name: "activate", label: T.shop.bought },
        { name: "later", label: T.shop.nextTime },
      ]}
      onAccessibilityAction={(event) =>
        event.nativeEvent.actionName === "later" ? onLater() : onBuy()
      }
      style={styles.slot}
    >
      <SwipeUnder drag={moved} side={1} armed={C.shopList.row.swipe.buy} />
      <SwipeUnder drag={moved} side={-1} armed={C.shopList.row.swipe.later} />
      <Animated.View style={nudgeStyle}>
        <SwipeGesture
          onSwipeRight={onBuy}
          onSwipeLeft={onLater}
          translation={drag}
          swipeThreshold={ARM}
          styles={{ box: styles.swipeBox }}
        >
          <View style={styles.rowMain}>
            <CText weight="medium" size={skin.type.body} style={styles.flex} numberOfLines={1}>
              {name}
            </CText>
          </View>
        </SwipeGesture>
      </Animated.View>
    </View>
  );
};

const createStyles = (s: Skin, L = calmColors(s).shopList.row) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    slot: {
      borderBottomColor: L.divider,
      borderBottomWidth: s.shape.divider,
      overflow: "hidden",
    },
    swipeBox: { backgroundColor: L.fill },
    rowMain: {
      alignItems: "center",
      backgroundColor: L.fill,
      flexDirection: "row",
      minHeight: s.size.row.shop,
      paddingStart: s.spacing.stack,
    },
  });

export default PracticeRow;
