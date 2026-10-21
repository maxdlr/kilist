import PanGesture from "@/components/gestures/PanGesture";
import { ThemedText } from "@/components/themed-text";
import {
  Dimensions,
  Image,
  StyleSheet,
  type LayoutChangeEvent,
} from "react-native";
import { usePanGesture } from "react-native-gesture-handler";
import Animated, {
  clamp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { SwipeFoodCardProps } from "../interface";
import { useTheme } from "@/hooks/use-theme";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_RANGE = 15; // degrees, at full drag distance

const SwipeFoodCard = ({ food, onSwipe }: SwipeFoodCardProps) => {
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const grabbing = useSharedValue(false);
  const containerWidth = useSharedValue(SCREEN_WIDTH);
  const theme = useTheme();

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
          translationX.value = 0;
          translationY.value = 0;
          scheduleOnRN(triggerSwipe, direction);
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
      <Animated.Text
        style={[
          styles.badge,
          styles.likeBadge,
          {
            borderColor: theme.confirm[60],
            color: theme.confirm[60],
          },
          likeOpacity,
        ]}
      >
        LIKE
      </Animated.Text>
      <Animated.Text
        style={[
          styles.badge,
          styles.nopeBadge,
          {
            borderColor: theme.cancel[60],
            color: theme.cancel[60],
          },
          nopeOpacity,
        ]}
      >
        NOPE
      </Animated.Text>
      <ThemedText type="title">{food.name}</ThemedText>
      <Image src={food.imageUrl} />
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
    // backgroundColor: "#b58df1",
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
    transform: [{ rotateZ: "-15deg" }],
  },
  nopeBadge: {
    right: 24,
    transform: [{ rotateZ: "15deg" }],
  },
});

export default SwipeFoodCard;
