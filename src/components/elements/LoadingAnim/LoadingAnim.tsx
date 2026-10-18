import { ColorScale } from "@/utils/colorUtils";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

const LoadingAnim = ({ colorScale }: { colorScale: ColorScale }) => {
  const load = {
    from: {
      transform: [{ rotateZ: "0deg" }],
    },
    to: {
      transform: [{ rotateZ: "360deg" }],
    },
  };

  return (
    <Animated.View
      style={{
        animationName: load,
        borderColor: colorScale[80],
        borderTopColor: colorScale[50],
        ...styles.spinner,
      }}
    />
  );
};

const styles = StyleSheet.create({
  spinner: {
    animationDuration: "1s",
    animationIterationCount: "infinite",
    animationTimingFunction: "linear",

    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 12,
  },
});
export default LoadingAnim;
