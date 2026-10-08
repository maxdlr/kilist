import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  GestureDetector,
  useLongPressGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import Animated, {
  AnimatedStyle,
  runOnJS,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSwipeGesture } from "./useSwipeGesture";

const SwipeGesture = ({
  children,
  styles,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  swipeThreshold,
  animatedStyles,
}: {
  children: ReactNode;
  styles: {
    box: StyleProp<ViewStyle>;
  };
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  animatedStyles?: AnimatedStyle<ViewStyle>;
}) => {
  const { translationX, pan } = useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    swipeThreshold,
  });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translationX.value }],
  }));

  const longPress = useLongPressGesture({
    onActivate: () => {
      if (onLongPress) {
        runOnJS(onLongPress)();
      }
    },
  });

  const composedGesture = useSimultaneousGestures(pan, longPress);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.box, swipeStyle, animatedStyles]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

export default SwipeGesture;
