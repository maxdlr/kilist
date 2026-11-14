import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import {
  GestureDetector,
  useLongPressGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import Animated, {
  AnimatedStyle,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSwipeGesture } from "./useSwipeGesture";
import { scheduleOnRN } from "react-native-worklets";

const SwipeGesture = ({
  children,
  styles,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onSwipingLeft,
  onSwipingRight,
  swipeThreshold,
  animatedStyles,
  translation,
}: {
  children: ReactNode;
  styles: {
    box: StyleProp<ViewStyle>;
  };
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  onSwipingLeft?: (value: number) => void;
  onSwipingRight?: (value: number) => void;
  swipeThreshold?: number;
  animatedStyles?: AnimatedStyle<ViewStyle>;
  translation?: SharedValue<number>;
}) => {
  const { translationX, pan } = useSwipeGesture({
    onSwipeLeft,
    onSwipeRight,
    onSwipingLeft,
    onSwipingRight,
    swipeThreshold,
    translation,
  });

  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translationX.value }],
  }));

  const longPress = useLongPressGesture({
    onActivate: () => {
      if (onLongPress) {
        scheduleOnRN(onLongPress);
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
