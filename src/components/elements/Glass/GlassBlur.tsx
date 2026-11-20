import useResumeCount from "@/hooks/useResumeCount";
import type { GlassTarget } from "@/providers/TabBarProvider";
import AnimationService from "@/services/animation";
import { BlurView } from "expo-blur";
import { useIsFocused } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { BLUR_ENABLED, type GlassSettings } from "./glassSettings";

const TINTLESS = 1;

const GlassBlur = ({
  target,
  settings,
  enabled = BLUR_ENABLED,
}: {
  target: GlassTarget;
  settings: GlassSettings;
  enabled?: boolean;
}) => {
  const resumed = useResumeCount();
  const focused = useIsFocused();
  const shown = useSharedValue(Platform.OS === "android" ? 0 : 1);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const slide = AnimationService.screen.duration;
    if (focused) {
      shown.set(0);
      shown.set(withDelay(slide, withTiming(1, AnimationService.enter)));
    } else {
      shown.set(withDelay(slide, withTiming(0, { duration: 0 })));
    }
  }, [focused, shown]);

  const fade = useAnimatedStyle(() => ({ opacity: shown.value }));

  if (!enabled) return null;

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, fade]}>
      <BlurView
        key={resumed}
        blurTarget={target}
        intensity={Platform.OS === "android" ? TINTLESS : settings.blur}
        blurReductionFactor={(TINTLESS * settings.androidReduction) / Math.max(1, settings.blur)}
        blurMethod="dimezisBlurViewSdk31Plus"
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

export default GlassBlur;
