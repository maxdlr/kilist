import Press from "@/components/elements/Press";
import withPressed from "@/utils/withPressed";
import type { Skin } from "@/skins/types";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;

const KilSwitch = ({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const position = useSharedValue(value ? 1 : 0);
  const thumb = TRACK_HEIGHT - skin.shape.border * 2 - 6;
  const travel = TRACK_WIDTH - thumb - skin.shape.border * 2 - 6;

  useEffect(() => {
    position.set(withTiming(value ? 1 : 0, AnimationService.config));
  }, [value, position]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * travel }],
  }));

  const on = skin.actions.primary;

  return (
    <Press
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onChange(!value)}
      style={withPressed([
        styles.track,
        {
          backgroundColor: value ? on.fill : skin.colors.paper,
          borderColor: value ? on.line : skin.colors.onPaper,
        },
        disabled && styles.disabled,
      ])}
    >
      <Animated.View
        style={[
          styles.thumb,
          { width: thumb, height: thumb, backgroundColor: value ? on.ink : skin.colors.onPaper },
          thumbStyle,
        ]}
      />
    </Press>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    track: {
      borderRadius: s.shape.radius > 0 ? TRACK_HEIGHT / 2 : 0,
      borderWidth: s.shape.border,
      height: TRACK_HEIGHT,
      justifyContent: "center",
      paddingHorizontal: 3,
      width: TRACK_WIDTH,
    },
    thumb: {
      borderRadius: s.shape.radius > 0 ? TRACK_HEIGHT / 2 : 0,
    },
    disabled: {
      opacity: 0.45,
    },
  });

export default KilSwitch;
