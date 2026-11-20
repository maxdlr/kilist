import AnimationService from "@/services/animation";
import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

const useNudge = (trigger: number) => {
  const x = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;
    const { distance, duration, count } = AnimationService.feedback.nudge;
    const step = { duration, easing: AnimationService.feedback.tint.easing };
    x.set(
      withSequence(
        withRepeat(withSequence(withTiming(-distance, step), withTiming(distance, step)), count),
        withTiming(0, step),
      ),
    );
  }, [trigger, x]);

  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
};

export default useNudge;
