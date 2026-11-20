import { useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { hexToHsv, hsvToHex, type HSV } from "@/utils/colorUtils";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";

const WHEEL = 220;
const STRIP_HEIGHT = 28;
const KNOB = 26;
const SLICES = 72;
const HUE_STEP = 15;
const MIN_SHADE = 0.15;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const R = WHEEL / 2;

const slicePath = (index: number) => {
  const from = ((index - 0.6) / SLICES) * Math.PI * 2;
  const to = ((index + 0.6) / SLICES) * Math.PI * 2;
  const point = (angle: number) => `${R + R * Math.cos(angle)} ${R + R * Math.sin(angle)}`;
  return `M ${R} ${R} L ${point(from)} A ${R} ${R} 0 0 1 ${point(to)} Z`;
};

const SLICE_PATHS = Array.from({ length: SLICES }, (_, index) => ({
  d: slicePath(index),
  fill: hsvToHex({ h: (index / SLICES) * 360, s: 1, v: 1 }),
}));

type Props = {
  initial: string;
  onChange: (color: string) => void;
  hueLabel: string;
  shadeLabel: string;
};

const ColorPicker = ({ initial, onChange, hueLabel, shadeLabel }: Props) => {
  const styles = useSkinStyles(createStyles);
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(initial));
  const [width, setWidth] = useState(0);
  const latest = useRef({ hsv, width, onChange });

  useEffect(() => {
    latest.current.onChange = onChange;
  }, [onChange]);

  const update = (next: HSV) => {
    latest.current.hsv = next;
    setHsv(next);
    latest.current.onChange(hsvToHex(next));
  };

  const pickWheel = (x: number, y: number) => {
    const dx = x - R;
    const dy = y - R;
    const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    update({ ...latest.current.hsv, h: hue, s: clamp(Math.hypot(dx, dy) / R) });
  };

  const pickShade = (x: number) => {
    const { hsv: now, width: w } = latest.current;
    if (!w) return;
    update({ ...now, v: clamp(x / w, MIN_SHADE) });
  };

  const wheelPan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onBegin: (event) => pickWheel(event.x, event.y),
    onUpdate: (event) => pickWheel(event.x, event.y),
  });

  const shadePan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onBegin: (event) => pickShade(event.x),
    onUpdate: (event) => pickShade(event.x),
  });

  const measure = (event: LayoutChangeEvent) => {
    latest.current.width = event.nativeEvent.layout.width;
    setWidth(event.nativeEvent.layout.width);
  };
  const angle = (hsv.h * Math.PI) / 180;
  const bright = hsvToHex({ h: hsv.h, s: hsv.s, v: 1 });
  const current = hsvToHex(hsv);
  const knob = (left: number, top: number, fill: string) => [
    styles.knob,
    { left: left - KNOB / 2, top: top - KNOB / 2, backgroundColor: fill },
  ];

  return (
    <View style={styles.root}>
      <GestureDetector gesture={wheelPan}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={hueLabel}
          accessibilityValue={{ min: 0, max: 360, now: Math.round(hsv.h) }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(event) =>
            update({
              ...hsv,
              h: (hsv.h + (event.nativeEvent.actionName === "increment" ? HUE_STEP : 360 - HUE_STEP)) % 360,
            })
          }
          style={styles.wheel}
        >
          <Svg width={WHEEL} height={WHEEL}>
            <Defs>
              <RadialGradient id="center" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            {SLICE_PATHS.map((slice) => (
              <Path key={slice.d} d={slice.d} fill={slice.fill} />
            ))}
            <Circle cx={R} cy={R} r={R} fill="url(#center)" />
            <Circle cx={R} cy={R} r={R} fill="#000000" opacity={1 - hsv.v} />
          </Svg>
          <View
            pointerEvents="none"
            style={knob(R + Math.cos(angle) * hsv.s * R, R + Math.sin(angle) * hsv.s * R, current)}
          />
        </View>
      </GestureDetector>
      <GestureDetector gesture={shadePan}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={shadeLabel}
          accessibilityValue={{ text: current }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          onAccessibilityAction={(event) =>
            update({
              ...hsv,
              v: clamp(hsv.v + (event.nativeEvent.actionName === "increment" ? 0.1 : -0.1), MIN_SHADE),
            })
          }
          onLayout={measure}
          style={styles.strip}
        >
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#000000" />
                <Stop offset="1" stopColor={bright} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={STRIP_HEIGHT / 2} fill="url(#shade)" />
          </Svg>
          {width > 0 && <View pointerEvents="none" style={knob(hsv.v * width, STRIP_HEIGHT / 2, current)} />}
        </View>
      </GestureDetector>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: { gap: s.spacing.section },
    wheel: { alignSelf: "center", height: WHEEL, width: WHEEL },
    strip: { height: STRIP_HEIGHT },
    knob: {
      borderColor: "#FFFFFF",
      borderRadius: KNOB / 2,
      borderWidth: 3,
      height: KNOB,
      position: "absolute",
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.35,
      shadowRadius: 3,
      width: KNOB,
      elevation: 3,
    },
  });

export default ColorPicker;
