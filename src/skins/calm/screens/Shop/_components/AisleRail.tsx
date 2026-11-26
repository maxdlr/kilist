import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import T from "@/skins/calm/text";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components";

export type RailStop = { id: string; label: string; left: number };

type Leaving = { stop: RailStop; at: number };

const REACH = 1.4;

const LEAVE_MS = AnimationService.exit.duration * 2;

const TINT = {
  transitionDuration: AnimationService.feedback.tint.duration,
  transitionProperty: ["backgroundColor", "width"] as string[],
  transitionTimingFunction: "ease-out",
};

const idsOf = (stops: RailStop[]) => stops.map((stop) => stop.id).join("|");

const Tick = ({
  height,
  leaving,
  front,
  children,
}: {
  height: number;
  leaving: boolean;
  front: boolean;
  children: ReactNode;
}) => {
  const styles = useSkinStyles(createStyles);
  const life = useSharedValue(0);

  useEffect(() => {
    life.set(
      withTiming(leaving ? 0 : 1, {
        duration: leaving ? LEAVE_MS : AnimationService.enter.duration,
        easing: AnimationService.easeOut,
      }),
    );
  }, [leaving, life]);

  const grow = useAnimatedStyle(() => ({
    height: height * life.value,
    opacity: life.value,
    transform: [{ scale: life.value }],
  }));

  return <Animated.View style={[styles.tick, front && styles.front, grow]}>{children}</Animated.View>;
};

const AisleRail = ({
  stops,
  focusId,
  onGlide,
  onPick,
}: {
  stops: RailStop[];
  focusId: string | null;
  onGlide: (id: string | null) => void;
  onPick: (id: string) => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const tick = skin.size.button.xs - 2 + skin.spacing.small;
  const [at, setAt] = useState<number | null>(null);
  const [seen, setSeen] = useState({ key: idsOf(stops), stops });
  const [leaving, setLeaving] = useState<Leaving[]>([]);
  const last = useRef<number | null>(null);
  const count = stops.length;
  const key = idsOf(stops);

  if (key !== seen.key) {
    const kept = new Set(stops.map((stop) => stop.id));
    const gone = seen.stops.flatMap((stop, index) => (kept.has(stop.id) ? [] : [{ stop, at: index }]));
    setSeen({ key, stops });
    setLeaving((current) => [...current.filter((entry) => !kept.has(entry.stop.id)), ...gone]);
  }

  useEffect(() => {
    if (leaving.length === 0) return;
    const timer = setTimeout(() => setLeaving([]), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [leaving]);

  const indexOf = (position: number) => Math.max(0, Math.min(count - 1, Math.round(position)));

  const move = (y: number) => {
    const position = Math.max(-0.5, Math.min(count - 0.5, (count * tick - y) / tick - 0.5));
    setAt(position);
    const index = indexOf(position);
    if (index !== last.current) {
      last.current = index;
      const stop = stops[index];
      if (stop) onGlide(stop.id);
    }
  };

  const end = () => {
    const stop = last.current !== null ? stops[last.current] : undefined;
    last.current = null;
    setAt(null);
    onGlide(null);
    if (stop) onPick(stop.id);
  };

  const pan = usePanGesture({
    minDistance: 0,
    onBegin: (event) => {
      scheduleOnRN(move, event.y);
    },
    onUpdate: (event) => {
      scheduleOnRN(move, event.y);
    },
    onFinalize: () => {
      scheduleOnRN(end);
    },
  });

  if (count === 0 && leaving.length === 0) return null;

  const gliding = at !== null;
  const active = gliding ? indexOf(at) : stops.findIndex((stop) => stop.id === focusId);
  const shown: { stop: RailStop; index: number; leaving: boolean }[] = stops.map((stop, index) => ({
    stop,
    index,
    leaving: false,
  }));
  for (const entry of [...leaving].sort((a, b) => a.at - b.at)) {
    shown.splice(Math.min(entry.at, shown.length), 0, { stop: entry.stop, index: -1, leaving: true });
  }
  const current = active >= 0 ? stops[active] : undefined;

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={T.shop.rail}
        accessibilityValue={{ text: current ? T.shop.railAisle(current.label, current.left) : undefined }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          const next = Math.max(0, Math.min(count - 1, active + (event.nativeEvent.actionName === "increment" ? 1 : -1)));
          if (stops[next]) onPick(stops[next].id);
        }}
        style={styles.rail}
      >
        {shown.map(({ stop, index, leaving: going }) => {
          const near = gliding && !going ? Math.exp(-(((index - at) / REACH) ** 2)) : 0;
          const on = !going && index === active;
          return (
            <Tick key={stop.id} height={tick} leaving={going} front={on}>
              {gliding && !going && (
                <View
                  pointerEvents="none"
                  style={[
                    styles.pill,
                    on && styles.pillOn,
                    {
                      opacity: on ? 1 : Math.max(0.55, near),
                      transform: [{ translateX: -skin.spacing.section * near }, { scale: 1 + 0.1 * near }],
                    },
                  ]}
                >
                  <CText
                    size={on ? skin.type.lead : skin.type.label}
                    weight={on ? "semibold" : "medium"}
                    color={on ? C.onFill : C.textSoft}
                    numberOfLines={1}
                  >
                    {stop.label}
                  </CText>
                </View>
              )}
              <View style={[styles.pip, on && styles.pipOn, { transform: [{ scale: 1 + 1.2 * near }] }, TINT]} />
            </Tick>
          );
        })}
      </View>
    </GestureDetector>
  );
};

const PIP = 6;

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    rail: {
      bottom: s.spacing.inline,
      flexDirection: "column-reverse",
      position: "absolute",
      right: 0,
      width: s.size.button.xs + s.spacing.tight,
      zIndex: 4,
    },
    tick: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingEnd: s.spacing.stack - 2,
    },
    front: { zIndex: 2 },
    pip: { backgroundColor: C.fieldLine, borderRadius: PIP / 2, height: PIP, width: PIP },
    pipOn: { backgroundColor: C.fill, width: PIP * 2.6 },
    pill: {
      alignItems: "center",
      backgroundColor: C.card,
      borderColor: C.line,
      borderRadius: s.size.button.xs / 2,
      borderWidth: s.shape.border,
      flexDirection: "row",
      minHeight: s.size.button.xs - 6,
      paddingHorizontal: s.spacing.stack - 2,
      position: "absolute",
      right: s.size.button.xs,
      transformOrigin: "right center",
    },
    pillOn: {
      backgroundColor: C.fill,
      borderColor: C.fill,
      boxShadow: `0 6px 18px ${C.scrim}`,
      minHeight: s.size.button.md - 8,
      paddingHorizontal: s.spacing.stack + 2,
      zIndex: 2,
    },
  });

export default AisleRail;
