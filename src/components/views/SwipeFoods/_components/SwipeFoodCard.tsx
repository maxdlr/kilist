import PanGesture from "@/components/gestures/PanGesture";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { inStockScoreToDisplay } from "@/utils/scoreUtils";
import { Image } from "expo-image";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
} from "react-native";
import { usePanGesture } from "react-native-gesture-handler";
import {
  EllipsisVerticalIcon,
  HeartIcon,
  StarIcon,
  XMarkIcon,
} from "react-native-heroicons/solid";
import Animated, {
  clamp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { SwipeFoodCardProps } from "../interface";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const VERTICAL_SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_RANGE = 15; // degrees, at full drag distance
const FLING_DURATION = 250;

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

  const neutralOpacity = useAnimatedStyle(() => ({
    opacity: clamp(
      interpolate(translationY.value, [0, -VERTICAL_SWIPE_THRESHOLD], [0, 1]),
      0,
      1,
    ),
  }));

  const triggerSwipe = (direction: "left" | "right" | "up") => {
    onSwipe(food.id, direction);
  };

  const flingTo = (direction: "left" | "right" | "up") => {
    "worklet";
    if (direction === "up") {
      const flingTarget = -containerWidth.value * 1.5;
      translationY.value = withTiming(
        flingTarget,
        { duration: FLING_DURATION },
        () => {
          scheduleOnRN(triggerSwipe, "up");
        },
      );
      return;
    }

    const flingTarget =
      (direction === "right" ? 1 : -1) * containerWidth.value * 1.5;
    translationX.value = withTiming(
      flingTarget,
      { duration: FLING_DURATION },
      () => {
        scheduleOnRN(triggerSwipe, direction);
      },
    );
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

      const horizontalDistance = Math.abs(translationX.value);
      const verticalDistance = Math.abs(translationY.value);

      const passedHorizontal = horizontalDistance > SWIPE_THRESHOLD;
      // Only an upward swipe maps to a gesture (downward has no meaning here).
      const passedVertical =
        translationY.value < 0 && verticalDistance > VERTICAL_SWIPE_THRESHOLD;

      if (passedVertical && verticalDistance > horizontalDistance) {
        flingTo("up");
        return;
      }

      if (passedHorizontal) {
        flingTo(translationX.value > 0 ? "right" : "left");
        return;
      }

      translationX.value = withTiming(0);
      translationY.value = withTiming(0);
    },
  });

  const foodDisplay = inStockScoreToDisplay(food.inStockScore, theme);

  return (
    <PanGesture
      styles={{
        box: {
          ...styles.box,
          backgroundColor: food.imageUrl
            ? theme.background
            : foodDisplay.color[50],
          borderColor: foodDisplay.color[60],
          borderWidth: 2,
        },
        container: styles.container,
        root: styles.root,
      }}
      pan={pan}
      onLayout={handleLayout}
      animatedStyles={cardStyle}
    >
      {food.imageUrl && (
        <Image
          source={{ uri: food.imageUrl }}
          style={styles.foodImage}
          contentFit="cover"
        />
      )}

      <Animated.View style={styles.topBar}>
        <Pressable style={styles.topBarButton} onPress={() => {}}>
          <EllipsisVerticalIcon size={20} color="#FFFFFF" />
        </Pressable>
      </Animated.View>

      <Animated.View style={styles.badgeContainer}>
        <Animated.Text
          style={[
            styles.badge,
            styles.likeBadge,
            { color: theme.confirm[60] },
            likeOpacity,
          ]}
        >
          In stock!
        </Animated.Text>

        <Animated.Text
          style={[
            styles.badge,
            styles.nopeBadge,
            { color: theme.cancel[60] },
            nopeOpacity,
          ]}
        >
          Out!
        </Animated.Text>

        <Animated.Text
          style={[
            styles.badge,
            styles.neutralBadge,
            { color: theme.textSecondary },
            neutralOpacity,
          ]}
        >
          Not sure!
        </Animated.Text>
      </Animated.View>

      <Animated.View style={styles.bottomSection}>
        <Animated.View style={styles.infoOverlay}>
          <ThemedText type="subtitle" style={styles.foodName}>
            {food.name}
          </ThemedText>
          {food.description && (
            <ThemedText
              type="default"
              style={styles.foodDescription}
              numberOfLines={1}
            >
              {food.description}
            </ThemedText>
          )}
        </Animated.View>

        <Animated.View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionButton, styles.actionButtonSmall]}
            onPress={() => flingTo("left")}
          >
            <XMarkIcon size={24} color={theme.cancel[60]} />
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.actionButtonLarge]}
            onPress={() => flingTo("up")}
          >
            <StarIcon size={22} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.actionButtonSmall]}
            onPress={() => flingTo("right")}
          >
            <HeartIcon size={24} color={theme.confirm[60]} />
          </Pressable>
        </Animated.View>
      </Animated.View>
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
    justifyContent: "flex-end",
  },
  box: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.9,
    borderRadius: 32,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  foodImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  topBar: {
    position: "absolute",
    top: Spacing.three,
    right: Spacing.three,
  },
  topBarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  badge: {
    top: Spacing.four,
    position: "absolute",
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
  neutralBadge: {
    alignSelf: "center",
  },
  bottomSection: {
    width: "100%",
  },
  infoOverlay: {
    width: "100%",
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  foodName: {
    color: "#FFFFFF",
  },
  foodDescription: {
    color: "#FFFFFF",
    opacity: 0.85,
  },
  actionsRow: {
    width: "100%",
    paddingVertical: Spacing.three,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.four,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  actionButton: {
    borderRadius: 100,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  actionButtonSmall: {
    width: 52,
    height: 52,
  },
  actionButtonLarge: {
    width: 44,
    height: 44,
  },
});

export default SwipeFoodCard;
