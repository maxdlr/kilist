import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService, { projectFling } from "@/services/animation";
import type { ActionColors, Skin } from "@/skins/types";
import { createContext, ReactNode, RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import {
  GestureDetector,
  useLongPressGesture,
  usePanGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import Animated, {
  type SharedValue,
  clamp,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export type SwipeDirection = "left" | "right" | "up";
export type SwipeDeckFling = (direction: SwipeDirection) => void;
export type SwipeDeckReturn = { key: string | number; direction: SwipeDirection } | null;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const COMMIT_X = 100;
const COMMIT_UP = 90;
const INTENT_AT = 24;
const STAMP_FULL_AT = 80;
const FLICK_VELOCITY = 600;
const BACK_SCALE = 0.95;
const NUDGE = 100;
const NUDGE_PAUSE_MS = 900;
const NUDGE_SETTLE_MS = 150;

export const deckButtonColors = (
  skin: Skin,
  intent: SwipeDirection | null,
  direction: SwipeDirection,
  outlinedWhenIdle = false,
): ActionColors => {
  const filled = intent ? intent === direction : !outlinedWhenIdle;
  return filled ? skin.actions.primary : skin.actions.secondary;
};

const offscreen = (direction: SwipeDirection | null) => ({
  x: direction === "right" ? SCREEN_WIDTH * 1.6 : direction === "left" ? -SCREEN_WIDTH * 1.6 : 0,
  y: direction === "up" ? -SCREEN_HEIGHT * 1.2 : 0,
});

type DeckKey = string | number;

const DeckRise = createContext<SharedValue<number> | null>(null);

export const useDeckRise = () => useContext(DeckRise);
type Flinger = (direction: SwipeDirection) => void;

const DeckSheet = ({
  itemKey,
  order,
  gone,
  register,
  isTop,
  leaving,
  onGone,
  returnFrom,
  nudging,
  allowUp,
  stamps,
  onIntent,
  onSwipe,
  onLongPress,
  children,
}: {
  onLongPress?: () => void;
  itemKey: DeckKey;
  order: SharedValue<DeckKey[]>;
  gone: SharedValue<DeckKey[]>;
  register: (key: DeckKey, flinger: Flinger | null) => void;
  isTop: boolean;
  leaving: boolean;
  onGone: () => void;
  returnFrom: SwipeDirection | null;
  nudging: boolean;
  allowUp: boolean;
  stamps: Partial<Record<SwipeDirection, string>>;
  onIntent: (intent: SwipeDirection | null) => void;
  onSwipe: (direction: SwipeDirection) => void;
  children: ReactNode;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const x = useSharedValue(offscreen(returnFrom).x);
  const y = useSharedValue(offscreen(returnFrom).y);
  const flung = useSharedValue(false);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const speedX = useSharedValue(0);
  const speedY = useSharedValue(0);
  const rise = useSharedValue(isTop ? 1 : 0);
  const dragging = useSharedValue(false);

  const handlers = useRef({ onSwipe, onIntent, onGone, onLongPress });
  useEffect(() => {
    handlers.current = { onSwipe, onIntent, onGone, onLongPress };
  });
  const hasLongPress = onLongPress !== undefined;

  const callIntent = useCallback((next: SwipeDirection | null) => handlers.current.onIntent(next), []);
  const callCommit = useCallback((direction: SwipeDirection) => {
    handlers.current.onSwipe(direction);
    handlers.current.onIntent(null);
  }, []);
  const callGone = useCallback(() => handlers.current.onGone(), []);
  const callHold = useCallback(() => handlers.current.onLongPress?.(), []);

  const isTopNow = useCallback(() => {
    "worklet";
    return order.value.find((key) => !gone.value.includes(key)) === itemKey;
  }, [order, gone, itemKey]);

  useAnimatedReaction(
    () => flung.value || isTopNow(),
    (front, previous) => {
      if (front !== previous) rise.set(withTiming(front ? 1 : 0, AnimationService.enter));
    },
  );

  useEffect(() => {
    x.set(withTiming(0, AnimationService.config));
    y.set(withTiming(0, AnimationService.config));
  }, [x, y]);

  useEffect(() => {
    if (leaving || !flung.value) return;
    flung.set(false);
    x.set(withTiming(0, AnimationService.config));
    y.set(withTiming(0, AnimationService.config));
  }, [leaving, flung, x, y]);
  const lastIntent = useSharedValue<SwipeDirection | null>(null);
  const nudge = useSharedValue(0);

  useEffect(() => {
    if (!nudging) {
      nudge.set(withTiming(0, { duration: NUDGE_SETTLE_MS }));
      return;
    }
    nudge.set(
      withRepeat(
        withSequence(
          withTiming(-NUDGE, AnimationService.config),
          withTiming(0, AnimationService.config),
          withTiming(NUDGE, AnimationService.config),
          withTiming(0, AnimationService.config),
          withDelay(NUDGE_PAUSE_MS, withTiming(0, { duration: 0 })),
        ),
        -1,
      ),
    );
  }, [nudging, nudge]);

  useAnimatedReaction(
    () =>
      nudge.value > INTENT_AT
        ? "right"
        : nudge.value < -INTENT_AT
          ? "left"
          : null,
    (next, previous) => {
      if (previous !== undefined && next !== previous)
        scheduleOnRN(callIntent, next);
    },
  );

  const fling = useCallback(
    (direction: SwipeDirection) => {
      "worklet";
      if (flung.value) return;
      flung.set(true);
      dragging.set(false);
      gone.modify((keys) => {
        "worklet";
        return keys.includes(itemKey) ? keys : [...keys, itemKey];
      });
      scheduleOnRN(callCommit, direction);

      const done = (finished?: boolean) => {
        "worklet";
        if (finished) scheduleOnRN(callGone);
      };
      const timing = AnimationService.fling;

      if (direction === "up") {
        y.set(withTiming(-SCREEN_HEIGHT * 1.2, timing, done));
        return;
      }
      x.set(withTiming((direction === "right" ? 1 : -1) * SCREEN_WIDTH * 1.6, timing, done));
    },
    [flung, dragging, gone, itemKey, callCommit, callGone, x, y],
  );

  useEffect(() => {
    if (leaving) return;
    register(itemKey, (direction) => {
      callIntent(direction);
      fling(direction);
    });
    return () => register(itemKey, null);
  }, [leaving, register, itemKey, callIntent, fling]);

  const panConfig = useMemo(
    () => ({
      onActivate: () => {
        "worklet";
        dragging.set(!flung.value && isTopNow());
        if (!dragging.value) return;
        startX.set(x.value);
        startY.set(y.value);
        speedX.set(0);
        speedY.set(0);
      },
      onUpdate: (event: { translationX: number; translationY: number; velocityX: number; velocityY: number }) => {
        "worklet";
        if (flung.value || !dragging.value) return;
        x.set(startX.value + event.translationX);
        y.set(startY.value + event.translationY);
        speedX.set(event.velocityX);
        speedY.set(event.velocityY);

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
          scheduleOnRN(callIntent, next);
        }
      },
      onFinalize: () => {
        "worklet";
        if (flung.value || !dragging.value) return;
        dragging.set(false);

        const vx = speedX.value;
        const vy = speedY.value;
        speedX.set(0);
        speedY.set(0);
        const flickX =
          Math.abs(vx) > FLICK_VELOCITY && Math.sign(vx) === Math.sign(x.value)
            ? x.value + projectFling(vx)
            : x.value;
        const flickY = vy < -FLICK_VELOCITY && y.value < 0 ? y.value + projectFling(vy) : y.value;

        if (allowUp && flickY < -COMMIT_UP && -y.value > Math.abs(x.value)) {
          fling("up");
        } else if (flickX > COMMIT_X && x.value > INTENT_AT) {
          fling("right");
        } else if (flickX < -COMMIT_X && x.value < -INTENT_AT) {
          fling("left");
        } else {
          x.set(withSpring(0, { ...AnimationService.settle, velocity: vx }));
          y.set(withSpring(0, { ...AnimationService.settle, velocity: vy }));
          lastIntent.set(null);
          scheduleOnRN(callIntent, null);
        }
      },
    }),
    [allowUp, fling, callIntent, isTopNow, dragging, flung, startX, startY, speedX, speedY, x, y, lastIntent],
  );
  const pan = usePanGesture(panConfig);

  const holdConfig = useMemo(
    () => ({
      enabled: hasLongPress,
      onActivate: () => {
        "worklet";
        if (!flung.value && isTopNow()) scheduleOnRN(callHold);
      },
    }),
    [hasLongPress, callHold, flung, isTopNow],
  );
  const hold = useLongPressGesture(holdConfig);
  const gesture = useSimultaneousGestures(pan, hold);

  const sheetStyle = useAnimatedStyle(() => ({
    pointerEvents: flung.value ? "none" : "auto",
    transform: [
      { translateX: x.value + nudge.value },
      { translateY: y.value },
      { rotateZ: `${(x.value + nudge.value) / 26}deg` },
      { scale: interpolate(rise.value, [0, 1], [BACK_SCALE, 1]) },
    ],
  }));

  const rightStamp = useAnimatedStyle(() => ({
    opacity: clamp(
      interpolate(x.value, [INTENT_AT, STAMP_FULL_AT], [0, 1]),
      0,
      1,
    ),
  }));
  const leftStamp = useAnimatedStyle(() => ({
    opacity: clamp(
      interpolate(-x.value, [INTENT_AT, STAMP_FULL_AT], [0, 1]),
      0,
      1,
    ),
  }));
  const upStamp = useAnimatedStyle(() => ({
    opacity: clamp(
      interpolate(-y.value, [INTENT_AT, STAMP_FULL_AT], [0, 1]),
      0,
      1,
    ),
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
      <Animated.View style={[StyleSheet.absoluteFill, sheetStyle]}>
        <DeckRise.Provider value={rise}>{children}</DeckRise.Provider>
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
  nudging = false,
  returnFrom = null,
}: {
  returnFrom?: SwipeDeckReturn;
  onLongPress?: (item: T) => void;
  background?: string;
  nudging?: boolean;
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
  const [leaving, setLeaving] = useState<{ key: string | number; item: T }[]>([]);
  const shown = items.slice(0, 3);
  const order = useSharedValue<DeckKey[]>(shown.map(keyOf));
  const gone = useSharedValue<DeckKey[]>([]);
  const flingers = useRef(new Map<DeckKey, Flinger>());
  const shownKeys = shown.map(keyOf);

  useEffect(() => {
    order.set(shownKeys);
    gone.modify((current) => {
      "worklet";
      return current.filter((key) => shownKeys.includes(key));
    });
  });

  const register = useCallback((key: DeckKey, flinger: Flinger | null) => {
    if (flinger) flingers.current.set(key, flinger);
    else flingers.current.delete(key);
  }, []);

  useEffect(() => {
    flingRef.current = (direction) => {
      const top = order.value.find((key) => !gone.value.includes(key));
      if (top !== undefined) flingers.current.get(top)?.(direction);
    };
  }, [flingRef, order, gone]);

  const live = new Set(items.map(keyOf));
  const flying = leaving.filter((entry) => !live.has(entry.key));
  const landed = (key: string | number) =>
    setLeaving((current) => current.filter((entry) => entry.key !== key));

  const sheet = (item: T, depth: number) => {
    const key = keyOf(item);
    const isLeaving = depth < 0;
    return (
      <DeckSheet
        key={key}
        itemKey={key}
        order={order}
        gone={gone}
        register={register}
        isTop={depth === 0}
        leaving={isLeaving}
        onGone={() => landed(key)}
        returnFrom={returnFrom && returnFrom.key === key ? returnFrom.direction : null}
        nudging={nudging && depth === 0}
        allowUp={allowUp}
        stamps={stamps}
        onIntent={onIntent}
        onSwipe={(direction) => {
          setLeaving((current) => [...current.filter((entry) => entry.key !== key), { key, item }]);
          onSwipe(item, direction);
        }}
        onLongPress={onLongPress ? () => onLongPress(item) : undefined}
      >
        {renderSheet(item, depth)}
      </DeckSheet>
    );
  };

  return (
    <View
      style={[
        styles.deck,
        { backgroundColor: background ?? skin.colors.ground },
      ]}
    >
      {[
        ...shown
          .map((item, depth) => sheet(item, depth))
          .reverse(),
        ...flying.map((entry) => sheet(entry.item, -1)),
      ]}
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
