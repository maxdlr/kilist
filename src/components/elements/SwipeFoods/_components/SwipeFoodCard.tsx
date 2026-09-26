import { ThemedText } from "@/components/themed-text";
import { Dimensions, StyleSheet, type LayoutChangeEvent } from "react-native";
import { usePanGesture } from "react-native-gesture-handler";
import Animated, {
  clamp,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SwipeFoodCardProps } from "../interface";
import PanGesture from "../../PanGesture";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_RANGE = 15; // degrees, at full drag distance

const SwipeFoodCard = ({ food, onSwipe }: SwipeFoodCardProps) => {
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const grabbing = useSharedValue(false);
  const containerWidth = useSharedValue(SCREEN_WIDTH);

  const handleLayout = (event: LayoutChangeEvent) => {
    containerWidth.value = event.nativeEvent.layout.width;
  };

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translationX.value,
      [-containerWidth.value, containerWidth.value],
      [-ROTATION_RANGE, ROTATION_RANGE],
    );

    return {
      transform: [
        { translateX: translationX.value },
        { translateY: translationY.value },
        { rotateZ: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: clamp(
      interpolate(translationX.value, [0, SWIPE_THRESHOLD], [0, 1]),
      0,
      1,
    ),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: clamp(
      interpolate(translationX.value, [0, -SWIPE_THRESHOLD], [0, 1]),
      0,
      1,
    ),
  }));

  const triggerSwipe = (direction: "left" | "right") => {
    onSwipe(food.id, direction);
  };

  const pan = usePanGesture({
    minDistance: 1,
    onBegin: () => {
      grabbing.value = true;
    },
    onUpdate: (event) => {
      translationX.value = event.translationX;
      translationY.value = event.translationY;
    },
    onFinalize: () => {
      grabbing.value = false;

      if (Math.abs(translationX.value) > SWIPE_THRESHOLD) {
        const direction = translationX.value > 0 ? "right" : "left";
        const flingTarget =
          (direction === "right" ? 1 : -1) * containerWidth.value * 1.5;

        translationX.value = withTiming(flingTarget, { duration: 250 }, () => {
          // Reset only after the fly-off animation completes: SwipeFoods reuses
          // this same mounted instance for the next card (no `key` prop), so the
          // offset must not carry over, but resetting too early would cut the
          // animation short.
          translationX.value = 0;
          translationY.value = 0;
          runOnJS(triggerSwipe)(direction);
        });
        return;
      }

      translationX.value = withTiming(0);
      translationY.value = withTiming(0);
    },
  });

  return (
    <PanGesture
      styles={styles}
      pan={pan}
      onLayout={handleLayout}
      animatedStyles={cardStyle}
    >
      <Animated.Text style={[styles.badge, styles.likeBadge, likeOpacity]}>
        LIKE
      </Animated.Text>
      <Animated.Text style={[styles.badge, styles.nopeBadge, nopeOpacity]}>
        NOPE
      </Animated.Text>
      <ThemedText type="title">{food.name}</ThemedText>
    </PanGesture>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  box: {
    width: SCREEN_WIDTH * 0.85,
    aspectRatio: 3 / 4,
    backgroundColor: "#b58df1",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 24,
    borderWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 28,
    fontWeight: "800",
  },
  likeBadge: {
    left: 24,
    borderColor: "#4cd964",
    color: "#4cd964",
    transform: [{ rotateZ: "-15deg" }],
  },
  nopeBadge: {
    right: 24,
    borderColor: "#ff3b30",
    color: "#ff3b30",
    transform: [{ rotateZ: "15deg" }],
  },
});

export default SwipeFoodCard;
