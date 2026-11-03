import { Easing } from "react-native-reanimated";

const config = {
  duration: 700,
  easing: Easing.bezier(0.1, 0, 0, 1),
};

const AnimationService = {
  config,
};

export default AnimationService;
