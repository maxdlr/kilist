import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { ActionColors, Skin } from "@/skins/types";
import { ReactNode, RefObject, useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import {
  GestureDetector,
  useLongPressGesture,
  usePanGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import Animated, {
  clamp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export type SwipeDirection = "left" | "right" | "up";
export type SwipeDeckFling = (direction: SwipeDirection) => void;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const COMMIT_X = 100;
const COMMIT_UP = 90;
const INTENT_AT = 24;
const STAMP_FULL_AT = 80;
const FLING_DURATION = 170;

export const deckButtonColors = (
  skin: Skin,
  intent: SwipeDirection | null,
  direction: SwipeDirection,
  outlinedWhenIdle = false,
): ActionColors => {
  const filled = intent ? intent === direction : !outlinedWhenIdle;
  return filled ? skin.actions.primary : skin.actions.secondary;
};

const DeckSheet = ({
  isTop,
  allowUp,
  stamps,
  flingRef,
  onIntent,
  onSwipe,
  onLongPress,
  children,
}: {
  onLongPress?: () => void;
  isTop: boolean;
  allowUp: boolean;
  stamps: Partial<Record<SwipeDirection, string>>;
  flingRef: RefObject<SwipeDeckFling | null>;
  onIntent: (intent: SwipeDirection | null) => void;
  onSwipe: (direction: SwipeDirection) => void;
  children: ReactNode;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const flung = useSharedValue(false);
  const lastIntent = useSharedValue<SwipeDirection | null>(null);

  const finish = (direction: SwipeDirection) => {
    onIntent(null);
    onSwipe(direction);
  };

  const fling = (direction: SwipeDirection) => {
    "worklet";
    if (flung.value) return;
    flung.set(true);

    const done = () => {
      "worklet";
      scheduleOnRN(finish, direction);
    };
    const timing = { duration: FLING_DURATION };

    if (direction === "up") {
      y.set(withTiming(-SCREEN_HEIGHT * 1.2, timing, done));
      return;
    }
    x.set(
      withTiming((direction === "right" ? 1 : -1) * SCREEN_WIDTH * 1.6, timing, done),
    );
  };

  useEffect(() => {
    if (!isTop) return;
    flingRef.current = (direction) => {
      onIntent(direction);
      fling(direction);
    };
  });

  const pan = usePanGesture({
    enabled: isTop,
    onUpdate: (event) => {
      if (flung.value) return;
      x.set(event.translationX);
      y.set(event.translationY);

      let next: SwipeDirection | null = null;
      if (allowUp && y.value < -INTENT_AT && -y.value > Math.abs(x.value)) {
        next = "up";
      } else if (x.value > INTENT_AT) {
        next = "right";
      } else if (x.value < -INTENT_AT) {
        next = "left";
      }

      if (next !== lastIntent.value) {
        lastIntent.set(next);
        scheduleOnRN(onIntent, next);
      }
    },
    onFinalize: () => {
      if (flung.value) return;

      if (allowUp && y.value < -COMMIT_UP && -y.value > Math.abs(x.value)) {
        fling("up");
      } else if (x.value > COMMIT_X) {
        fling("right");
      } else if (x.value < -COMMIT_X) {
        fling("left");
      } else {
        x.set(withTiming(0, { duration: 200 }));
        y.set(withTiming(0, { duration: 200 }));
        lastIntent.set(null);
        scheduleOnRN(onIntent, null);
      }
    },
  });

  const hold = useLongPressGesture({
    enabled: isTop && onLongPress !== undefined,
    onActivate: () => {
      if (onLongPress && !flung.value) scheduleOnRN(onLongPress);
    },
  });
  const gesture = useSimultaneousGestures(pan, hold);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotateZ: `${x.value / 26}deg` },
    ],
  }));

  const rightStamp = useAnimatedStyle(() => ({
    opacity: clamp(interpolate(x.value, [INTENT_AT, STAMP_FULL_AT], [0, 1]), 0, 1),
  }));
  const leftStamp = useAnimatedStyle(() => ({
    opacity: clamp(interpolate(-x.value, [INTENT_AT, STAMP_FULL_AT], [0, 1]), 0, 1),
  }));
  const upStamp = useAnimatedStyle(() => ({
    opacity: clamp(interpolate(-y.value, [INTENT_AT, STAMP_FULL_AT], [0, 1]), 0, 1),
  }));

  const isSticker = skin.game.stamp === "sticker";
  const stickerFill: Record<SwipeDirection, string> = {
    right: skin.colors.success,
    left: skin.colors.alert,
    up: skin.colors.paper,
  };
  const stickerTurn: Record<SwipeDirection, string> = {
    right: "-12deg",
    left: "12deg",
    up: "0deg",
  };
  const opacityFor = { right: rightStamp, left: leftStamp, up: upStamp };

  const renderStamp = (direction: SwipeDirection) => {
    const label = stamps[direction];
    if (!label) return null;

    if (!isSticker) {
      return (
        <Animated.Text
          key={direction}
          allowFontScaling={false}
          style={[
            styles.stamp,
            {
              color: skin.colors.paper,
              fontFamily: skin.fonts.display.family,
              textShadowColor: skin.colors.onPaper,
            },
            opacityFor[direction],
          ]}
        >
          {label}
        </Animated.Text>
      );
    }

    return (
      <Animated.View
        key={direction}
        style={[styles.stickerWrap, opacityFor[direction]]}
      >
        <Animated.Text
          allowFontScaling={false}
          style={[
            styles.sticker,
            {
              backgroundColor: stickerFill[direction],
              borderColor: skin.colors.onPaper,
              color: skin.colors.onPaper,
              fontFamily: skin.fonts.display.family,
              transform: [{ rotateZ: stickerTurn[direction] }],
            },
          ]}
        >
          {label}
        </Animated.Text>
      </Animated.View>
    );
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[StyleSheet.absoluteFill, sheetStyle]}
      >
        {children}
        {renderStamp("right")}
        {renderStamp("left")}
        {renderStamp("up")}
      </Animated.View>
    </GestureDetector>
  );
};

const SwipeDeck = <T,>({
  items,
  keyOf,
  renderSheet,
  stamps,
  allowUp = false,
  flingRef,
  onIntent,
  onSwipe,
  onLongPress,
  background,
}: {
  onLongPress?: (item: T) => void;
  background?: string;
  items: T[];
  keyOf: (item: T) => string | number;
  renderSheet: (item: T, depth: number) => ReactNode;
  stamps: Partial<Record<SwipeDirection, string>>;
  allowUp?: boolean;
  flingRef: RefObject<SwipeDeckFling | null>;
  onIntent: (intent: SwipeDirection | null) => void;
  onSwipe: (item: T, direction: SwipeDirection) => void;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <View style={[styles.deck, { backgroundColor: background ?? skin.colors.ground }]}>
      {items
        .slice(0, 2)
        .map((item, depth) => (
        <DeckSheet
          key={keyOf(item)}
          isTop={depth === 0}
          allowUp={allowUp}
          stamps={stamps}
          flingRef={flingRef}
          onIntent={onIntent}
          onSwipe={(direction) => onSwipe(item, direction)}
          onLongPress={onLongPress ? () => onLongPress(item) : undefined}
        >
          {renderSheet(item, depth)}
        </DeckSheet>
        ))
        .reverse()}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    deck: {
      flex: 1,
      overflow: "hidden",
    },
    stamp: {
      fontSize: s.type.display.stamp,
      left: 0,
      lineHeight: Math.round(s.type.display.stamp * s.fonts.display.lineHeight),
      pointerEvents: "none",
      position: "absolute",
      right: 0,
      textAlign: "center",
      textShadowOffset: {
        width: s.shape.stampShadow,
        height: s.shape.stampShadow,
      },
      textShadowRadius: 1,
      top: "32%",
      transform: [{ rotateZ: "-8deg" }],
    },
    stickerWrap: {
      alignItems: "center",
      left: 0,
      pointerEvents: "none",
      position: "absolute",
      right: 0,
      top: "14%",
    },
    sticker: {
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      fontSize: s.type.display.stamp,
      lineHeight: Math.round(s.type.display.stamp * s.fonts.display.lineHeight),
      overflow: "hidden",
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.tight,
    },
  });

export default SwipeDeck;
