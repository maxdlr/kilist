import AnimationService from "@/services/animation";
import { useEffect } from "react";
import { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useCalmColors } from "./colors";

const BEHIND_CONTENT = 0.35;

export const useDeckCardLook = (behind: boolean) => {
  const C = useCalmColors();
  const front = useSharedValue(behind ? 0 : 1);

  useEffect(() => {
    front.set(withTiming(behind ? 0 : 1, AnimationService.config));
  }, [behind, front]);

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(front.value, [0, 1], [C.tint, C.card]),
    borderColor: interpolateColor(front.value, [0, 1], [C.tint, C.line]),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: BEHIND_CONTENT + (1 - BEHIND_CONTENT) * front.value,
  }));

  return { cardStyle, contentStyle };
};
