import { CheckIcon } from "@/components/icons";
import type { RunAisle } from "@/hooks/screens/useRunAisles";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService, { projectFling } from "@/services/animation";
import type { Skin } from "@/skins/types";
import { useEffect, useRef, useState } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeOut,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components";

const BUBBLE_WIDTH = 220;

const GLIDE = {
  growLiveMs: 120,
  slideFromPx: 30,
  minScale: 1,
  maxScale: 2.2,
  reach: 1.2,
  carry: 0.35,
};

const TINT = {
  transitionDuration: AnimationService.feedback.tint.duration,
  transitionProperty: ["backgroundColor"] as string[],
  transitionTimingFunction: "ease-out",
};

const swell = (distance: number) => {
  "worklet";
  return GLIDE.minScale + (GLIDE.maxScale - GLIDE.minScale) * Math.exp(-((distance / GLIDE.reach) ** 2));
};

const fitOf = (count: number, base: number, room: number, focus: number, live: number) => {
  "worklet";
  const rest = (count - 1) * GLIDE.minScale + GLIDE.maxScale;
  let swollen = 0;
  for (let index = 0; index < count; index += 1) swollen += swell(Math.abs(index - focus));
  const sum = rest * (1 - live) + swollen * live;
  return sum > 0 && base > 0 ? Math.min(1, room / (base * sum)) : 1;
};

const Segment = ({
  aisle,
  index,
  shown,
  on,
  gap,
  count,
  base,
  room,
  focus,
  live,
  onPick,
}: {
  aisle: RunAisle;
  index: number;
  shown: boolean;
  on: boolean;
  gap: number;
  count: number;
  base: number;
  room: number;
  focus: SharedValue<number>;
  live: SharedValue<number>;
  onPick: () => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const rest = useSharedValue(on ? GLIDE.maxScale : GLIDE.minScale);
  const presence = useSharedValue(shown ? 1 : 0);
  const place = useSharedValue(index);

  useEffect(() => {
    if (index >= 0) place.set(index);
    presence.set(
      withTiming(shown ? 1 : 0, {
        duration: AnimationService.exit.duration * 1.5,
        easing: AnimationService.easeOut,
      }),
    );
  }, [shown, index, place, presence]);

  useEffect(() => {
    rest.set(
      withTiming(on ? GLIDE.maxScale : GLIDE.minScale, {
        duration: AnimationService.reflow,
        easing: AnimationService.easeOut,
      }),
    );
  }, [on, rest]);

  const shape = useAnimatedStyle(() => {
    const l = live.value;
    const p = presence.value;
    const size = base * fitOf(count, base, room, focus.value, l);
    const scale = rest.value * (1 - l) + swell(Math.abs(place.value - focus.value)) * l;
    return {
      borderRadius: size / 2,
      height: size * (0.6 + 0.4 * p),
      marginHorizontal: (gap / 2) * p,
      opacity: p,
      width: size * scale * p,
    };
  });
  const ink = on ? C.onFill : C.text;

  return (
    <Animated.View
      accessible={shown}
      importantForAccessibility={shown ? "auto" : "no-hide-descendants"}
      accessibilityRole="button"
      accessibilityLabel={T.shop.aisleSegment(aisle.label, aisle.count)}
      accessibilityState={{ selected: on }}
      accessibilityActions={[{ name: "activate" }]}
      onAccessibilityAction={onPick}
      style={[styles.segment, { backgroundColor: on ? C.fill : C.tint }, TINT, shape]}
    >
      {aisle.count > 0 ? (
        <CText size={skin.type.body} weight="medium" color={ink}>
          {aisle.count}
        </CText>
      ) : (
        <CheckIcon size={skin.type.body} color={on ? C.onFill : C.textSoft} strokeWidth={3} />
      )}
    </Animated.View>
  );
};

const AisleScrubBar = ({
  aisles: all,
  openId,
  onPick,
}: {
  aisles: RunAisle[];
  openId: string | null;
  onPick: (id: string) => void;
}) => {
  const C = useCalmColors();
  const skin = useSkin();
  const themed = useSkinStyles(createStyles);
  const isShown = (aisle: RunAisle) => aisle.count > 0 || aisle.id === openId;
  const aisles = all.filter(isShown);
  const count = aisles.length;
  const gap = skin.spacing.tight;
  const [width, setWidth] = useState(0);
  const [bubble, setBubble] = useState<number | null>(null);
  const latest = useRef({ aisles, openId, onPick });
  const focus = useSharedValue(0);
  const live = useSharedValue(0);
  const scrubbing = useSharedValue(false);
  const moved = useSharedValue(false);
  const startX = useSharedValue(0);
  const speed = useSharedValue(0);
  const slot = useSharedValue(0);
  const last = useSharedValue(0);
  const span = useSharedValue(0);

  useEffect(() => {
    latest.current = { aisles, openId, onPick };
    slot.set(count > 0 ? width / count : 0);
    last.set(Math.max(0, count - 1));
    span.set(width);
  });

  const room = width - (count - 1) * gap;
  const base =
    count > 0 && width > 0
      ? Math.min(skin.size.button.md, room / ((count - 1) * GLIDE.minScale + GLIDE.maxScale))
      : 0;

  const choose = (index: number, scrub: boolean) => {
    const current = latest.current;
    const aisle = current.aisles[index];
    if (!aisle) return;
    if (scrub) setBubble(index);
    if (aisle.id !== current.openId) current.onPick(aisle.id);
  };

  const release = () => setBubble(null);

  useAnimatedReaction(
    () => (scrubbing.value ? Math.round(focus.value) : -1),
    (index, previous) => {
      if (index >= 0 && index !== previous) scheduleOnRN(choose, index, true);
    },
  );

  const settle = () => {
    "worklet";
    scrubbing.set(false);
    live.set(withTiming(0, { duration: AnimationService.reflow, easing: AnimationService.easeOut }));
    scheduleOnRN(release);
  };

  useEffect(() => {
    if (moved.get() || !scrubbing.get()) return;
    cancelAnimation(focus);
    scrubbing.set(false);
    live.set(
      withTiming(0, { duration: AnimationService.reflow, easing: AnimationService.easeOut }, () => {
        scheduleOnRN(release);
      }),
    );
  }, [count, moved, scrubbing, focus, live]);

  const pan = usePanGesture({
    minDistance: 0,
    onBegin: (event) => {
      startX.set(event.x);
      speed.set(0);
      moved.set(false);
    },
    onUpdate: (event) => {
      speed.set(event.velocityX);
      if (slot.value === 0) return;
      const at = Math.min(last.value, Math.max(0, event.x / slot.value - 0.5));
      if (!moved.value) {
        if (Math.abs(event.x - startX.value) < GLIDE.slideFromPx) return;
        moved.set(true);
        cancelAnimation(focus);
        focus.set(at);
        scrubbing.set(true);
        live.set(withTiming(1, { duration: GLIDE.growLiveMs, easing: AnimationService.easeOut }));
        return;
      }
      focus.set(at);
    },
    onFinalize: (event) => {
      if (slot.value === 0) return;
      if (!moved.value) {
        if (scrubbing.value) {
          cancelAnimation(focus);
          settle();
        }
        const index = Math.round(Math.min(last.value, Math.max(0, event.x / slot.value - 0.5)));
        scheduleOnRN(choose, index, false);
        return;
      }
      moved.set(false);
      const projected = focus.value + (projectFling(speed.value) * GLIDE.carry) / slot.value;
      const target = Math.round(Math.min(last.value, Math.max(0, projected)));
      focus.set(
        withSpring(target, { ...AnimationService.snap, velocity: speed.value / slot.value }, (finished) => {
          if (finished) settle();
        }),
      );
    },
  });

  const bubbleStyle = useAnimatedStyle(() => {
    const center = (focus.value + 0.5) * slot.value;
    const left = Math.min(Math.max(0, center - BUBBLE_WIDTH / 2), Math.max(0, span.value - BUBBLE_WIDTH));
    return { transform: [{ translateX: left }] };
  });

  const measure = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);
  const under = bubble !== null ? aisles[bubble] : null;

  if (count === 0) return null;

  return (
    <View style={themed.wrap}>
      {under && (
        <Animated.View
          pointerEvents="none"
          entering={FadeIn.duration(AnimationService.enter.duration)}
          exiting={FadeOut.duration(AnimationService.exit.duration)}
          style={[themed.bubble, { backgroundColor: C.fill }, bubbleStyle]}
        >
          <CText size={skin.type.title} weight="medium" color={C.onFill} numberOfLines={1}>
            {under.label}
          </CText>
          <CText size={skin.type.caption} color={C.onFill}>
            {under.count > 0 ? T.shop.toBuy(under.count) : T.shop.aisleEmpty}
          </CText>
        </Animated.View>
      )}
      <GestureDetector gesture={pan}>
        <View accessibilityLabel={T.shop.aisleBar} onLayout={measure} style={themed.track}>
          {all.map((aisle) => (
            <Segment
              key={aisle.id}
              aisle={aisle}
              index={aisles.indexOf(aisle)}
              shown={isShown(aisle)}
              gap={gap}
              on={aisle.id === openId}
              count={count}
              base={base}
              room={room}
              focus={focus}
              live={live}
              onPick={() => onPick(aisle.id)}
            />
          ))}
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  segment: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
});

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    wrap: { paddingHorizontal: s.spacing.stack, paddingTop: s.spacing.inline, zIndex: 2 },
    track: {
      alignItems: "center",
      flexDirection: "row",
      height: s.size.button.lg,
      justifyContent: "center",
    },
    bubble: {
      alignItems: "center",
      borderRadius: s.shape.radius + s.spacing.tight,
      bottom: s.size.button.lg + s.spacing.small,
      boxShadow: `0 12px 26px ${C.scrim}`,
      gap: s.spacing.hair,
      left: s.spacing.stack,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.inline,
      position: "absolute",
      width: BUBBLE_WIDTH,
      zIndex: 2,
    },
  });

export default AisleScrubBar;
