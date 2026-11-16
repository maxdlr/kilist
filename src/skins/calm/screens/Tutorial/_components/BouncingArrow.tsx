import { useSkin } from "@/providers/SkinProvider";
import { useEffect } from "react";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { ArrowDownIcon } from "@/components/icons";
import { useCalmColors } from "@/skins/calm/theme/useCalmColors";

const ARROW_BOUNCE = 20;

const ARROW_SWING = {
  duration: 1000,
  easing: Easing.bezier(0.5, 0, 0.5, 1),
};

const BouncingArrow = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const reduced = useReducedMotion();
  const drop = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    drop.set(
      withRepeat(
        withSequence(
          withTiming(ARROW_BOUNCE, ARROW_SWING),
          withTiming(0, ARROW_SWING),
        ),
        -1,
      ),
    );
  }, [reduced, drop]);

  const dropStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drop.value }],
  }));

  return (
    <Animated.View style={dropStyle}>
      <ArrowDownIcon
        size={skin.size.icon.action}
        color={C.text}
        strokeWidth={1.8}
      />
    </Animated.View>
  );
};

export default BouncingArrow;
