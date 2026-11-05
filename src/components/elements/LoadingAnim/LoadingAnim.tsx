import { useTheme } from "@/hooks/use-theme";
import { ColorScale } from "@/utils/colorUtils";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";

const LoadingAnim = ({
  colorScale,
  centered = false,
}: {
  colorScale?: ColorScale;
  centered?: boolean;
}) => {
  const theme = useTheme();
  const colors = colorScale ?? theme.confirm;

  const load = {
    from: {
      transform: [{ rotateZ: "0deg" }],
    },
    to: {
      transform: [{ rotateZ: "360deg" }],
    },
  };

  const spinner = (
    <Animated.View
      style={{
        animationName: load,
        borderColor: colors[80],
        borderTopColor: colors[50],
        ...styles.spinner,
      }}
    />
  );

  return centered ? <View style={styles.centered}>{spinner}</View> : spinner;
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
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
