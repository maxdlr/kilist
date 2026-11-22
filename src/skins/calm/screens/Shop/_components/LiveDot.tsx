import AnimationService from "@/services/animation";
import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useCalmColors } from "@/skins/calm/theme/useCalmColors";

const BLINK_MS = 900;

const LiveDot = ({ size = 10 }: { size?: number }) => {
  const C = useCalmColors();
  const glow = useSharedValue(1);

  useEffect(() => {
    glow.set(
      withRepeat(
        withSequence(
          withTiming(0.25, { duration: BLINK_MS, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: BLINK_MS, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
    return () => cancelAnimation(glow);
  }, [glow]);

  const style = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.85 + glow.value * 0.15 }],
  }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      entering={FadeIn.duration(AnimationService.enter.duration)}
      style={[
        {
          backgroundColor: C.success,
          borderRadius: size / 2,
          height: size,
          width: size,
        },
        style,
      ]}
    />
  );
};

export default LiveDot;
