import { useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { hexToHsv, hsvToHex, type HSV } from "@/utils/colorUtils";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

const AREA_HEIGHT = 168;
const STRIP_HEIGHT = 28;
const KNOB = 26;
const AREA_RADIUS = 14;
const HUE_STEP = 15;
const HUES = [0, 60, 120, 180, 240, 300, 360];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

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

  const pickShade = (x: number, y: number) => {
    const { hsv: now, width: w } = latest.current;
    if (!w) return;
    update({ h: now.h, s: clamp(x / w), v: 1 - clamp(y / AREA_HEIGHT) });
  };

  const pickHue = (x: number) => {
    const { hsv: now, width: w } = latest.current;
    if (!w) return;
    update({ ...now, h: clamp(x / w) * 359.999 });
  };

  const shadePan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onBegin: (event) => pickShade(event.x, event.y),
    onUpdate: (event) => pickShade(event.x, event.y),
  });

  const huePan = usePanGesture({
    runOnJS: true,
    minDistance: 0,
    onBegin: (event) => pickHue(event.x),
    onUpdate: (event) => pickHue(event.x),
  });

  const measure = (event: LayoutChangeEvent) => {
    latest.current.width = event.nativeEvent.layout.width;
    setWidth(event.nativeEvent.layout.width);
  };
  const pure = hsvToHex({ h: hsv.h, s: 1, v: 1 });
  const current = hsvToHex(hsv);
  const knob = (left: number, top: number, fill: string) => [
    styles.knob,
    { left: left - KNOB / 2, top: top - KNOB / 2, backgroundColor: fill },
  ];

  return (
    <View style={styles.root} onLayout={measure}>
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
              v: clamp(hsv.v + (event.nativeEvent.actionName === "increment" ? 0.1 : -0.1)),
            })
          }
          style={styles.area}
        >
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="white" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
              </LinearGradient>
              <LinearGradient id="black" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000000" stopOpacity={0} />
                <Stop offset="1" stopColor="#000000" stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={AREA_RADIUS} fill={pure} />
            <Rect width="100%" height="100%" rx={AREA_RADIUS} fill="url(#white)" />
            <Rect width="100%" height="100%" rx={AREA_RADIUS} fill="url(#black)" />
          </Svg>
          {width > 0 && (
            <View pointerEvents="none" style={knob(hsv.s * width, (1 - hsv.v) * AREA_HEIGHT, current)} />
          )}
        </View>
      </GestureDetector>
      <GestureDetector gesture={huePan}>
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
          style={styles.strip}
        >
          <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="hues" x1="0" y1="0" x2="1" y2="0">
                {HUES.map((hue) => (
                  <Stop key={hue} offset={hue / 360} stopColor={hsvToHex({ h: hue % 360, s: 1, v: 1 })} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" rx={STRIP_HEIGHT / 2} fill="url(#hues)" />
          </Svg>
          {width > 0 && (
            <View
              pointerEvents="none"
              style={knob((hsv.h / 360) * width, STRIP_HEIGHT / 2, pure)}
            />
          )}
        </View>
      </GestureDetector>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: { gap: s.spacing.inline },
    area: { height: AREA_HEIGHT },
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
