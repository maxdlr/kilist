import { useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";

const LIGHT_MS = 400;

const LIGHT_DIM = 0.2;

const StartLight = ({ color, index }: { color: string; index: number }) => {
  const styles = useSkinStyles(createStyles);
  const glow = useSharedValue(LIGHT_DIM);

  useEffect(() => {
    glow.set(
      withDelay(
        index * LIGHT_MS,
        withRepeat(
          withSequence(
            withTiming(1, { duration: LIGHT_MS }),
            withTiming(LIGHT_DIM, { duration: LIGHT_MS * 2 }),
          ),
          -1,
        ),
      ),
    );
  }, [glow, index]);

  const style = useAnimatedStyle(() => ({ opacity: glow.value }));

  return <Animated.View style={[styles.light, { backgroundColor: color }, style]} />;
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    light: { borderRadius: s.spacing.stack, height: s.spacing.stack, width: s.spacing.stack },
  });

export default StartLight;
