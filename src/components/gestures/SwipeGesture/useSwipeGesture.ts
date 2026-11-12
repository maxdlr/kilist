import AnimationService, { projectFling } from "@/services/animation";
import { Dimensions } from "react-native";
import { usePanGesture } from "react-native-gesture-handler";
import { useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const DEFAULT_SWIPE_THRESHOLD = 80;
const SCREEN_WIDTH = Dimensions.get("window").width;
const FLING_DISTANCE = SCREEN_WIDTH * 1.5;
const FLICK_VELOCITY = 500;

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipingLeft,
  onSwipingRight,
  swipeThreshold = DEFAULT_SWIPE_THRESHOLD,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipingLeft?: (value: number) => void;
  onSwipingRight?: (value: number) => void;
  swipeThreshold?: number;
}) => {
  const translationX = useSharedValue(0);
  const side = useSharedValue(0);
  const leaving = useSharedValue(false);
  const speed = useSharedValue(0);

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
      if (leaving.get()) return;
      translationX.set(event.translationX);
      speed.set(event.velocityX);

      const next = Math.sign(event.translationX);
      if (next === 0 || next === side.get()) return;
      side.set(next);
      if (next > 0) {
        if (onSwipingRight) scheduleOnRN(onSwipingRight, event.translationX);
      } else if (onSwipingLeft) {
        scheduleOnRN(onSwipingLeft, event.translationX);
      }
    },
    onFinalize: () => {
      if (leaving.get()) return;
      const current = translationX.get();
      const velocity = speed.get();
      speed.set(0);
      const flicked =
        Math.abs(velocity) > FLICK_VELOCITY &&
        Math.sign(velocity) === Math.sign(current) &&
        Math.abs(current + projectFling(velocity)) > swipeThreshold;
      side.set(0);

      if (Math.abs(current) <= swipeThreshold && !flicked) {
        translationX.set(withSpring(0, { ...AnimationService.snap, velocity }));
        return;
      }

      const direction = current > 0 ? "right" : "left";
      const flingTarget = (direction === "right" ? 1 : -1) * FLING_DISTANCE;
      leaving.set(true);

      translationX.set(
        withTiming(flingTarget, AnimationService.fling, () => {
          translationX.set(FLING_DISTANCE);
          leaving.set(false);
          scheduleOnRN(resolveSwipe, direction);
        }),
      );
    },
  });

  return { translationX, pan };
};
