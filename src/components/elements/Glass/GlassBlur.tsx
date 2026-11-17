import useResumeCount from "@/hooks/useResumeCount";
import type { GlassTarget } from "@/providers/TabBarProvider";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet } from "react-native";
import type { GlassSettings } from "./glassSettings";

const TINTLESS = 1;

const GlassBlur = ({ target, settings }: { target: GlassTarget; settings: GlassSettings }) => {
  const resumed = useResumeCount();

  return (
    <BlurView
      key={resumed}
      blurTarget={target}
      intensity={Platform.OS === "android" ? TINTLESS : settings.blur}
      blurReductionFactor={(TINTLESS * settings.androidReduction) / Math.max(1, settings.blur)}
      blurMethod="dimezisBlurViewSdk31Plus"
      style={StyleSheet.absoluteFill}
    />
  );
};

export default GlassBlur;
