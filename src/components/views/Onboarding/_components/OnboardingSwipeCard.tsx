import FoodIcon from "@/components/elements/FoodIcon";
import PanGesture from "@/components/gestures/PanGesture";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import AnimationService from "@/services/animation";
import { FoodBankItemType } from "@/types/model";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  type LayoutChangeEvent,
} from "react-native";
import { usePanGesture } from "react-native-gesture-handler";
import { HeartIcon, XMarkIcon } from "react-native-heroicons/solid";
import Animated, {
  clamp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const ROTATION_RANGE = 15;
const FLING_DURATION = 250;

// A deterministic placeholder background per item, since food-bank items have
// no images yet. Picks a food color shade from the item name.
const PLACEHOLDER_SHADES = [1, 2, 3, 4, 5] as const;

/**
 * Onboarding-only swipe card: a trimmed, two-way (add / skip) variant of the
 * stock-tracking SwipeFoodCard. Kept separate on purpose - the swipe semantics
 * and data shape differ, so sharing one component would mean conditionals for
 * two unrelated flows.
 */
const OnboardingSwipeCard = ({
  item,
  index,
  onSwipe,
}: {
  item: FoodBankItemType;
  index: number;
  onSwipe: (item: FoodBankItemType, direction: "left" | "right") => void;
}) => {
  const theme = useTheme();
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);
  const containerWidth = useSharedValue(SCREEN_WIDTH);

  const handleLayout = (event: LayoutChangeEvent) => {
    containerWidth.value = event.nativeEvent.layout.width;
  };

  const shadeKey =
    PLACEHOLDER_SHADES[item.name.length % PLACEHOLDER_SHADES.length]!;
  const placeholder = theme.foods[shadeKey];

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

  const addOpacity = useAnimatedStyle(() => ({
    opacity: clamp(
      interpolate(translationX.value, [0, SWIPE_THRESHOLD], [0, 1]),
      0,
      1,
    ),
  }));

  const skipOpacity = useAnimatedStyle(() => ({
    opacity: clamp(
      interpolate(translationX.value, [0, -SWIPE_THRESHOLD], [0, 1]),
      0,
      1,
    ),
  }));

  const trigger = (direction: "left" | "right") => {
    onSwipe(item, direction);
  };

  const flingTo = (direction: "left" | "right") => {
    "worklet";
    const target = (direction === "right" ? 1 : -1) * containerWidth.value * 1.5;
    translationX.value = withTiming(
      target,
      { duration: FLING_DURATION },
      () => {
        scheduleOnRN(trigger, direction);
      },
    );
  };

  const pan = usePanGesture({
    minDistance: 1,
    onUpdate: (event) => {
      translationX.value = event.translationX;
      translationY.value = event.translationY;
    },
    onFinalize: () => {
      if (Math.abs(translationX.value) > SWIPE_THRESHOLD) {
        flingTo(translationX.value > 0 ? "right" : "left");
        return;
      }
      translationX.value = withTiming(0);
      translationY.value = withTiming(0);
    },
  });

  const isTop = index === 0;

  const deckStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(index ? 1 - 0.1 * index : 1, AnimationService.config) },
      { translateY: withTiming(index * 80, AnimationService.config) },
    ],
  }));

  return (
    <Animated.View style={[styles.root, { zIndex: 100 - index }, deckStyle]}>
      <PanGesture
        disabled={!isTop}
        styles={{
          root: { flex: 1 },
          container: styles.container,
          box: {
            ...styles.box,
            backgroundColor: placeholder[50],
            borderColor: placeholder[60],
            borderWidth: 2,
          },
        }}
        pan={pan}
        onLayout={handleLayout}
        animatedStyles={cardStyle}
      >
        <Animated.View style={styles.iconContainer} pointerEvents="none">
          <FoodIcon name={item.icon} />
        </Animated.View>

        <Animated.View style={styles.badgeContainer}>
          <Animated.Text
            style={[
              styles.badge,
              styles.addBadge,
              { color: theme.confirm[60] },
              addOpacity,
            ]}
          >
            Add
          </Animated.Text>
          <Animated.Text
            style={[
              styles.badge,
              styles.skipBadge,
              { color: theme.cancel[60] },
              skipOpacity,
            ]}
          >
            Skip
          </Animated.Text>
        </Animated.View>

        <Animated.View style={styles.bottomSection}>
          <Animated.View style={styles.infoOverlay}>
            <ThemedText type="subtitle" style={styles.name}>
              {item.name}
            </ThemedText>
            {item.description && (
              <ThemedText
                type="default"
                style={styles.description}
                numberOfLines={1}
              >
                {item.description}
              </ThemedText>
            )}
          </Animated.View>

          <Animated.View style={styles.actionsRow}>
            <Pressable
              style={styles.actionButton}
              onPress={() => flingTo("left")}
            >
              <XMarkIcon size={24} color={theme.cancel[60]} />
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => flingTo("right")}
            >
              <HeartIcon size={24} color={theme.confirm[60]} />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </PanGesture>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: "absolute",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  box: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.55,
    borderRadius: 32,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  iconContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: SCREEN_HEIGHT * 0.1,
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
  addBadge: {
    left: 24,
    transform: [{ rotateZ: "-15deg" }],
  },
  skipBadge: {
    right: 24,
    transform: [{ rotateZ: "15deg" }],
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
  name: {
    color: "#FFFFFF",
  },
  description: {
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
    width: 52,
    height: 52,
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
});

export default OnboardingSwipeCard;
