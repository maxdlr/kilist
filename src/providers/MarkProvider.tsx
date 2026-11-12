import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import { caseFor } from "@/skins";
import type { Skin } from "@/skins/types";
import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

export type MarkKind = "added" | "removed" | "saved" | "done";

type Mark = { id: number; kind: MarkKind; text: string };
type Stroke = { d: string; length: number; from: number; to: number };

const HOLD = 900;
const DRAW_DELAY = 90;
const DRAW = 320;
const GLYPH = 44;
const RISE = 10;

const CHECK: Stroke[] = [{ d: "M5 12.5l4.5 4.5L19 7.5", length: 19.8, from: 0, to: 1 }];
const STROKES: Record<MarkKind, Stroke[]> = {
  added: [
    { d: "M12 5v14", length: 14, from: 0, to: 0.55 },
    { d: "M5 12h14", length: 14, from: 0.45, to: 1 },
  ],
  removed: [{ d: "M5 12h14", length: 14, from: 0, to: 1 }],
  saved: CHECK,
  done: CHECK,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const GlyphStroke = ({
  stroke,
  draw,
  color,
}: {
  stroke: Stroke;
  draw: SharedValue<number>;
  color: string;
}) => {
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(draw.get(), [stroke.from, stroke.to], [stroke.length, 0], "clamp"),
  }));

  return (
    <AnimatedPath
      d={stroke.d}
      stroke={color}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={stroke.length}
      animatedProps={animatedProps}
    />
  );
};

export const MarkGlyph = ({
  kind,
  draw,
  color,
  size = GLYPH,
}: {
  kind: MarkKind;
  draw: SharedValue<number>;
  color: string;
  size?: number;
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {STROKES[kind].map((stroke) => (
      <GlyphStroke key={stroke.d} stroke={stroke} draw={draw} color={color} />
    ))}
  </Svg>
);

export const DrawnMark = ({ kind, color, size }: { kind: MarkKind; color: string; size?: number }) => {
  const draw = useSharedValue(0);

  useEffect(() => {
    draw.set(withDelay(DRAW_DELAY * 2, withTiming(1, { duration: DRAW, easing: AnimationService.easeOut })));
  }, [draw]);

  return <MarkGlyph kind={kind} draw={draw} color={color} size={size} />;
};

type MarkContextType = { mark: (kind: MarkKind, text: string) => void };

const MarkContext = createContext<MarkContextType>({ mark: () => {} });

const MarkTile = ({ current, onGone }: { current: Mark; onGone: (id: number) => void }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const shown = useSharedValue(0);
  const draw = useSharedValue(0);
  const leaving = useSharedValue(0);
  const removed = current.kind === "removed";

  useEffect(() => {
    shown.set(withTiming(1, AnimationService.enter));
    draw.set(withDelay(DRAW_DELAY, withTiming(1, { duration: DRAW, easing: AnimationService.easeOut })));
    const leave = setTimeout(() => {
      leaving.set(
        withTiming(1, AnimationService.exit, () => {
          scheduleOnRN(onGone, current.id);
        }),
      );
    }, HOLD);
    return () => clearTimeout(leave);
  }, [current.id, shown, draw, leaving, onGone]);

  const tileStyle = useAnimatedStyle(() => ({
    opacity: shown.get() * (1 - leaving.get()),
    transform: [
      { translateY: (removed ? RISE : -RISE) * leaving.get() + RISE * (1 - shown.get()) },
      { scale: interpolate(shown.get(), [0, 1], [0.92, 1]) },
    ],
  }));

  return (
    <View pointerEvents="none" style={styles.layer}>
      <Animated.View
        style={[
          styles.tile,
          {
            backgroundColor: skin.panel.fill,
            borderColor: skin.panel.line,
            borderRadius: skin.panel.radius,
          },
          tileStyle,
        ]}
      >
        <MarkGlyph kind={current.kind} draw={draw} color={removed ? skin.colors.danger : skin.panel.title} />
        <ThemedText size={skin.type.lead} color={skin.panel.title} style={styles.text} numberOfLines={2}>
          {caseFor(skin, current.text)}
        </ThemedText>
      </Animated.View>
    </View>
  );
};

export const MarkProvider = ({ children }: { children: ReactNode }) => {
  const [current, setCurrent] = useState<Mark | null>(null);

  const mark = useCallback((kind: MarkKind, text: string) => {
    setCurrent((previous) => ({ id: (previous?.id ?? 0) + 1, kind, text }));
    AccessibilityInfo.announceForAccessibility(text);
  }, []);

  const clear = useCallback((id: number) => {
    setCurrent((shown) => (shown?.id === id ? null : shown));
  }, []);

  const value = useMemo(() => ({ mark }), [mark]);

  return (
    <MarkContext.Provider value={value}>
      {children}
      {current && <MarkTile key={current.id} current={current} onGone={clear} />}
    </MarkContext.Provider>
  );
};

const useMark = () => React.useContext(MarkContext);

export default useMark;

const createStyles = (s: Skin) =>
  StyleSheet.create({
    layer: {
      bottom: 0,
      left: 0,
      position: "absolute",
      right: 0,
      top: 0,
      alignItems: "center",
      justifyContent: "center",
      padding: s.spacing.page,
      zIndex: 900,
    },
    tile: {
      alignItems: "center",
      borderWidth: s.shape.border,
      gap: s.spacing.small,
      maxWidth: "100%",
      minWidth: s.size.button.lg * 2.4,
      paddingHorizontal: s.spacing.section,
      paddingVertical: s.spacing.section,
    },
    text: { textAlign: "center" },
  });
