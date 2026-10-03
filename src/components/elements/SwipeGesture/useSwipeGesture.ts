import { useSharedValue } from "react-native-reanimated";
import { usePanGesture } from "react-native-gesture-handler";
import { Dimensions } from "react-native";
import { runOnJS, withTiming } from "react-native-reanimated";

const DEFAULT_SWIPE_THRESHOLD = 80;
const SCREEN_WIDTH = Dimensions.get("window").width;
// Fling the row past the edge of the screen so it fully clears the viewport
// before resetting, instead of just reaching the swipe threshold.
const FLING_DISTANCE = SCREEN_WIDTH * 1.5;

/**
 * Builds the pan gesture backing a swipeable row: tracks horizontal
 * translation and, once the threshold is crossed, flings the row out of
 * bounds in that direction before firing the matching callback and
 * resetting. Falls back to snapping back to rest when under threshold.
 *
 * @param options.onSwipeLeft - Called when the row is swiped past the threshold to the left
 * @param options.onSwipeRight - Called when the row is swiped past the threshold to the right
 * @param options.swipeThreshold - Distance in points required to trigger a swipe action
 * @returns The horizontal translation shared value and the pan gesture to attach to a `GestureDetector`
 */
export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = DEFAULT_SWIPE_THRESHOLD,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
}) => {
  const translationX = useSharedValue(0);

  const resolveSwipe = (direction: "left" | "right") => {
    if (direction === "right") {
      onSwipeRight?.();
    } else {
      onSwipeLeft?.();
    }
  };

  const pan = usePanGesture({
    activeOffsetX: [-10, 10],
    failOffsetY: [-10, 10],
    onUpdate: (event) => {
      translationX.value = event.translationX;
    },
    onFinalize: () => {
      const pastThreshold = Math.abs(translationX.value) > swipeThreshold;

      if (!pastThreshold) {
        translationX.value = withTiming(0);
        return;
      }

      const direction = translationX.value > 0 ? "right" : "left";
      const flingTarget = (direction === "right" ? 1 : -1) * FLING_DISTANCE;

      translationX.value = withTiming(flingTarget, { duration: 250 }, () => {
        translationX.value = 0;
        runOnJS(resolveSwipe)(direction);
      });
    },
  });

  return { translationX, pan };
};
