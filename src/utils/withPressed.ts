import type { PressableStateCallbackType, StyleProp, ViewStyle } from "react-native";

const PRESSED_OPACITY = 0.6;

const withPressed =
  (style: StyleProp<ViewStyle>, opacity = PRESSED_OPACITY) =>
  ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [style, pressed && { opacity }];

export default withPressed;
