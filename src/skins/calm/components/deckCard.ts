import AnimationService from "@/services/animation";
import { useEffect } from "react";
import { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useDeckRise } from "@/components/elements/SwipeDeck";
import { useCalmColors } from "../theme/useCalmColors";

export const useDeckCardLook = (behind: boolean) => {
  const { front: face, behind: back } = useCalmColors().gameCard;
  const rise = useDeckRise();
  const own = useSharedValue(behind ? 0 : 1);
  const front = rise ?? own;

  useEffect(() => {
    own.set(withTiming(behind ? 0 : 1, AnimationService.config));
  }, [behind, own]);

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(front.value, [0, 1], [back.fill, face.fill]),
    borderColor: interpolateColor(front.value, [0, 1], [back.border, face.border]),
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: back.contentOpacity + (1 - back.contentOpacity) * front.value,
  }));

  return { cardStyle, contentStyle };
};
