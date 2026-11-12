import AnimationService from "@/services/animation";
import { useState } from "react";
import { Pressable, StyleSheet, type PressableProps} from "react-native";
import Animated from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Press = ({
  style,
  scale = false,
  onPressIn,
  onPressOut,
  ...rest
}: PressableProps & { scale?: boolean }) => {
  const [pressed, setPressed] = useState(false);
  const resolved = typeof style === "function" ? style({ pressed, hovered: false }) : style;
  const hasShadow = StyleSheet.flatten(resolved)?.boxShadow !== undefined;

  return (
    <AnimatedPressable
      pressRetentionOffset={16}
      {...rest}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[
        resolved,
        scale && !hasShadow && { transform: [{ scale: pressed ? AnimationService.press.scale : 1 }] },
        hasShadow ? FLAT_MOTION : MOTION,
      ]}
    />
  );
};

const MOTION = {
  transitionDuration: AnimationService.press.duration,
  transitionProperty: ["opacity", "backgroundColor", "borderColor", "transform"],
  transitionTimingFunction: AnimationService.cssEaseOut,
} as const;

const FLAT_MOTION = { ...MOTION, transitionProperty: ["opacity", "backgroundColor", "borderColor"] } as const;

export default Press;
