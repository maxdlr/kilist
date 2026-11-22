import { CheckIcon } from "@/components/icons";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService, { projectFling } from "@/services/animation";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { levelOf } from "@/utils/scoreUtils";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import {
  GestureDetector,
  useCompetingGestures,
  useLongPressGesture,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import T from "@/skins/calm/text";
import { useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText, Dot } from "@/skins/calm/components";

export const TICK_MS = 1100;
const FLICK_DISTANCE = 70;
const FLICK_VELOCITY = 500;
const HOLD_MS = 450;
const TINT = {
  transitionDuration: AnimationService.feedback.tint.duration,
  transitionProperty: ["backgroundColor", "borderColor"] as string[],
  transitionTimingFunction: "ease-out",
};

const ShopPill = ({
  food,
  big = false,
  suggested = false,
  teach = false,
  ticking = false,
  error = false,
  onTap,
  onFlick,
  onFlickArm,
  onHold,
}: {
  food: FoodType;
  big?: boolean;
  suggested?: boolean;
  teach?: boolean;
  ticking?: boolean;
  error?: boolean;
  onTap: () => void;
  onFlick: () => void;
  onFlickArm: (armed: boolean | null) => void;
  onHold: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const level = levelOf(food.inStockScore);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const fade = useSharedValue(1);
  const pressed = useSharedValue(0);
  const armed = useSharedValue(false);
  const leaving = useSharedValue(false);
  const bar = useSharedValue(1);
  const ring = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(bar);
    if (ticking) {
      bar.set(1);
      bar.set(withTiming(0, { duration: TICK_MS, easing: Easing.linear }));
    } else {
      bar.set(withTiming(1, AnimationService.exit));
    }
  }, [ticking, bar]);

  useEffect(() => {
    if (!teach) {
      cancelAnimation(ring);
      ring.set(withTiming(0, AnimationService.exit));
      return;
    }
    ring.set(
      withRepeat(
        withSequence(
          withTiming(0, { duration: 600 }),
          withTiming(1, { duration: 1400, easing: AnimationService.easeOut }),
        ),
        -1,
      ),
    );
  }, [teach, ring]);

  const pan = usePanGesture({
    activeOffsetX: [-10, 10],
    activeOffsetY: [-10, 10],
    onUpdate: (event) => {
      if (leaving.get()) return;
      x.set(event.translationX);
      y.set(event.translationY);
      const far = Math.hypot(event.translationX, event.translationY) > FLICK_DISTANCE;
      if (far !== armed.get()) {
        armed.set(far);
        scheduleOnRN(onFlickArm, far);
      }
    },
    onDeactivate: (event) => {
      if (leaving.get()) return;
      const dx = event.translationX;
      const dy = event.translationY;
      const speed = Math.hypot(event.velocityX, event.velocityY);
      const far = Math.hypot(dx, dy) > FLICK_DISTANCE;
      const flicked = far || (speed > FLICK_VELOCITY && Math.hypot(dx, dy) > 20);
      armed.set(false);
      if (!flicked) {
        x.set(withSpring(0, { ...AnimationService.settle, velocity: event.velocityX }));
        y.set(withSpring(0, { ...AnimationService.settle, velocity: event.velocityY }));
        scheduleOnRN(onFlickArm, null);
        return;
      }
      leaving.set(true);
      const fast = speed > FLICK_VELOCITY;
      const length = Math.max(1, Math.hypot(dx, dy));
      const towardX = fast ? event.velocityX / speed : dx / length;
      const towardY = fast ? event.velocityY / speed : dy / length;
      const push = Math.max(160, Math.abs(projectFling(speed)) * 0.4);
      x.set(withTiming(dx + towardX * push, AnimationService.fling));
      y.set(withTiming(dy + towardY * push, AnimationService.fling));
      fade.set(
        withTiming(0, AnimationService.fling, (finished) => {
          if (finished) scheduleOnRN(onFlick);
        }),
      );
    },
  });

  const tap = useTapGesture({
    maxDistance: 10,
    onActivate: () => {
      scheduleOnRN(onTap);
    },
  });

  const hold = useLongPressGesture({
    minDuration: HOLD_MS,
    onBegin: () => {
      pressed.set(withTiming(1, { duration: AnimationService.press.duration }));
    },
    onActivate: () => {
      scheduleOnRN(onHold);
    },
    onFinalize: () => {
      pressed.set(withTiming(0, { duration: AnimationService.press.duration }));
    },
  });

  const gesture = useCompetingGestures(pan, hold, tap);

  const motion = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: 1 - pressed.value * (1 - AnimationService.press.scale) },
      { rotate: `${x.value / 40}deg` },
    ],
    zIndex: x.value !== 0 || y.value !== 0 ? 2 : 0,
  }));
  const barStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: bar.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.55 * (ring.value > 0 ? 1 : 0),
    transform: [{ scale: 1 + ring.value * 0.18 }],
  }));

  const tone = ticking
    ? { fill: C.success, line: C.success, ink: C.onPositive, dot: C.onPositive }
    : error
      ? { fill: C.card, line: C.danger, ink: C.text, dot: skin.colors.levels[level] }
      : suggested
        ? { fill: C.card, line: C.fill, ink: C.text, dot: skin.colors.levels[level] }
        : { fill: "transparent", line: C.fieldLine, ink: C.text, dot: skin.colors.levels[level] };

  return (
    <Animated.View
      layout={LinearTransition.duration(AnimationService.reflow)}
      entering={FadeIn.duration(AnimationService.enter.duration)}
      exiting={FadeOutUp.duration(AnimationService.exit.duration * 1.5)}
    >
      <Animated.View pointerEvents="none" style={[styles.ring, { borderColor: C.success }, ringStyle]} />
      <GestureDetector gesture={gesture}>
        <Animated.View
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${food.name}, ${skin.copy.levels[level]}`}
          accessibilityHint={T.shop.pillHint}
          accessibilityState={{ selected: ticking }}
          accessibilityActions={[
            { name: "activate", label: T.shop.inBasket },
            { name: "later", label: T.shop.nextTime },
            { name: "longpress", label: T.shop.holdToEdit },
          ]}
          onAccessibilityAction={(event) => {
            const name = event.nativeEvent.actionName;
            if (name === "later") onFlick();
            else if (name === "longpress") onHold();
            else onTap();
          }}
          style={[
            styles.pill,
            big && styles.big,
            suggested && styles.suggested,
            { backgroundColor: tone.fill, borderColor: tone.line },
            TINT,
            motion,
          ]}
        >
          <Dot color={tone.dot} />
          <CText
            size={big ? skin.type.lead : skin.type.body}
            weight={suggested ? "medium" : "regular"}
            color={tone.ink}
            numberOfLines={1}
          >
            {food.name}
          </CText>
          {ticking && (
            <Animated.View entering={FadeIn.duration(AnimationService.enter.duration)}>
              <CheckIcon size={skin.type.body} color={tone.ink} strokeWidth={2.2} />
            </Animated.View>
          )}
          {ticking && <Animated.View pointerEvents="none" style={[styles.bar, { backgroundColor: C.onPositive }, barStyle]} />}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    pill: {
      alignItems: "center",
      borderRadius: s.size.toggle / 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.small,
      overflow: "hidden",
      paddingHorizontal: s.spacing.inline + 2,
      paddingVertical: s.spacing.small,
    },
    big: {
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.inline,
    },
    suggested: { borderWidth: s.shape.border * 1.5 },
    bar: {
      bottom: 0,
      height: 3,
      left: 0,
      opacity: 0.6,
      position: "absolute",
      right: 0,
      transformOrigin: "left",
    },
    ring: {
      ...StyleSheet.absoluteFill,
      borderRadius: s.size.toggle / 2,
      borderWidth: 2,
      opacity: 0,
    },
  });

export default ShopPill;
