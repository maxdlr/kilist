import { ReactNode } from "react";
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import Animated, { AnimatedStyle } from "react-native-reanimated";

const PanGesture = ({
  children,
  styles,
  pan,
  onLayout,
  animatedStyles,
}: {
  children: ReactNode;
  styles: {
    root: StyleProp<ViewStyle>;
    container: StyleProp<ViewStyle>;
    box: StyleProp<ViewStyle>;
  };
  pan: ReturnType<typeof usePanGesture>;
  onLayout?: (event: LayoutChangeEvent) => void;
  animatedStyles?: AnimatedStyle<ViewStyle>;
}) => {
  return (
    <View style={styles.root}>
      <View onLayout={onLayout} style={styles.container}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.box, animatedStyles]}>
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    </View>
  );
};

export default PanGesture;
