import AnimationService from "@/services/animation";
import type { StackCardStyleInterpolator, StackNavigationOptions } from "expo-router/js-stack";
import { Easing } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

const { duration, curve } = AnimationService.screen;

export const SLIDE = { animation: "timing", config: { duration, easing: Easing.bezier(...curve) } } as const;

const slide: StackCardStyleInterpolator = ({ current, next, layouts }) => {
  const width = layouts.screen.width;
  const entering = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [width, 0],
    extrapolate: "clamp",
  });
  const leaving = next
    ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [0, -width], extrapolate: "clamp" })
    : 0;

  return { cardStyle: { transform: [{ translateX: entering }, { translateX: leaving }] } };
};

export const useSlideStackOptions = (): StackNavigationOptions => {
  const reduced = useReducedMotion();

  return reduced
    ? { animation: "fade" }
    : {
        transitionSpec: { open: SLIDE, close: SLIDE },
        cardStyleInterpolator: slide,
        cardOverlayEnabled: false,
        cardShadowEnabled: false,
      };
};
