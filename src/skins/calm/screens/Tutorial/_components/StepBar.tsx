import { useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { StyleSheet, View } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { calmColors } from "@/skins/calm/theme/useCalmColors";

const StepBar = ({
  progress,
  label,
  now,
  max,
}: {
  progress: SharedValue<number>;
  label: string;
  now: number;
  max: number;
}) => {
  const styles = useSkinStyles(createStyles);
  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, progress.value)) * 100}%`,
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now }}
      style={styles.barTrack}
    >
      <Animated.View style={[styles.barFill, fillStyle]} />
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    barTrack: {
      backgroundColor: C.line,
      borderRadius: 2,
      height: 4,
      overflow: "hidden",
    },
    barFill: { backgroundColor: C.fill, borderRadius: 2, height: "100%" },
  });

export default StepBar;
