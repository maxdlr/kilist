import Press from "@/components/elements/Press";
import type { DockTone } from "@/providers/DockStore";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import withPressed from "@/utils/withPressed";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useCalmColors } from "../theme/useCalmColors";

const TRACK = { width: 34, height: 20 };
const GAP = 3;

export const CSwitch = ({
  value,
  onChange,
  label,
  tone = "ground",
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  tone?: DockTone;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const position = useSharedValue(value ? 1 : 0);
  const thumb = TRACK.height - GAP * 2 - skin.shape.border * 2;
  const travel = TRACK.width - thumb - GAP * 2 - skin.shape.border * 2;
  const look = {
    ground: { on: C.fill, onThumb: C.onFill, off: C.fieldLine, offThumb: C.ring },
    ink: { on: C.onFill, onThumb: C.fill, off: C.textSoft, offThumb: C.textSoft },
  }[tone];

  useEffect(() => {
    position.set(withTiming(value ? 1 : 0, AnimationService.config));
  }, [value, position]);

  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: position.value * travel }] }));

  return (
    <Press
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={skin.spacing.inline}
      onPress={() => onChange(!value)}
      style={withPressed([
        styles.track,
        { backgroundColor: value ? look.on : "transparent", borderColor: value ? look.on : look.off },
      ])}
    >
      <Animated.View
        style={[
          styles.thumb,
          { width: thumb, height: thumb, backgroundColor: value ? look.onThumb : look.offThumb },
          slide,
        ]}
      />
    </Press>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    track: {
      borderRadius: TRACK.height / 2,
      borderWidth: s.shape.border,
      height: TRACK.height,
      justifyContent: "center",
      paddingHorizontal: GAP,
      width: TRACK.width,
    },
    thumb: { borderRadius: TRACK.height / 2 },
  });
