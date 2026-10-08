import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { GestureDetector, useTapGesture } from "react-native-gesture-handler";
import Animated, { AnimatedStyle } from "react-native-reanimated";

const TapGesture = ({
  children,
  styles,
  tap,
  animatedStyles,
}: {
  children: ReactNode;
  styles: {
    root: StyleProp<ViewStyle>;
    box: StyleProp<ViewStyle>;
  };
  tap: ReturnType<typeof useTapGesture>;
  animatedStyles?: AnimatedStyle<ViewStyle>;
}) => {
  return (
    <View style={styles.root}>
      <GestureDetector gesture={tap}>
        <Animated.View style={[styles.box, animatedStyles]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default TapGesture;
