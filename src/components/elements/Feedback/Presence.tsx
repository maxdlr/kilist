import AnimationService from "@/services/animation";
import { type ReactNode, useEffect, useState } from "react";
import { type LayoutChangeEvent, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export type PresenceMotion = typeof AnimationService.feedback;

const Presence = ({
  visible,
  collapse = 0,
  motion = AnimationService.feedback,
  style,
  children,
}: {
  visible: boolean;
  collapse?: number;
  motion?: PresenceMotion;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) => {
  const [rendered, setRendered] = useState(visible);
  const [kept, setKept] = useState(children);
  const progress = useSharedValue(0);
  const height = useSharedValue(0);

  if (visible && kept !== children) setKept(children);
  if (visible && !rendered) setRendered(true);

  useEffect(() => {
    if (visible) {
      progress.set(withTiming(1, motion.enter));
      return;
    }
    progress.set(
      withTiming(0, motion.exit, (finished) => {
        "worklet";
        if (finished) scheduleOnRN(setRendered, false);
      }),
    );
  }, [visible, progress, motion]);

  const measure = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    height.set(height.get() > 0 && progress.get() === 1 ? withTiming(next, motion.layout) : next);
  };

  const rise = visible ? motion.enter.rise : motion.exit.rise;
  const outer = useAnimatedStyle(() => {
    return {
      height: progress.value * height.value,
      marginTop: (progress.value - 1) * collapse,
      opacity: progress.value,
      transform: [{ translateY: (1 - progress.value) * rise }],
    };
  });

  if (!rendered) return null;

  return (
    <Animated.View style={[styles.clip, outer]}>
      <View onLayout={measure} style={[styles.content, style]}>
        {visible ? children : kept}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  clip: { alignSelf: "stretch", overflow: "hidden" },
  content: { left: 0, position: "absolute", right: 0, top: 0 },
});

export default Presence;
