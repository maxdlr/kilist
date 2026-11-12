import { cubicBezier, Easing } from "react-native-reanimated";

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);

const config = {
  duration: 300,
  easing: EASE_SHEET,
};

const AnimationService = {
  config,
  easeOut: EASE_OUT,
  screen: { duration: 280, curve: [0.32, 0.72, 0, 1] as const },
  press: { duration: 120, scale: 0.97 },
  panelClose: { duration: 240, easing: EASE_SHEET },
  enter: { duration: 220, easing: EASE_OUT },
  exit: { duration: 180, easing: EASE_OUT },
  reflow: 200,
  settle: { duration: 400, dampingRatio: 0.8 },
  snap: { duration: 300, dampingRatio: 1 },
  fling: { duration: 220, easing: EASE_OUT },
};

export const CSS_EASE_OUT = cubicBezier(0.23, 1, 0.32, 1);

export const projectFling = (velocity: number, decelerationRate = 0.998) => {
  "worklet";
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
};

export default AnimationService;
