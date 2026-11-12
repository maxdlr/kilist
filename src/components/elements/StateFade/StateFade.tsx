import AnimationService from "@/services/animation";
import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

const ENTER = FadeIn.duration(AnimationService.enter.duration).easing(AnimationService.easeOut);

const StateFade = ({ stateKey, children }: { stateKey: string; children: ReactNode }) => (
  <Animated.View key={stateKey} entering={ENTER} style={styles.fill}>
    {children}
  </Animated.View>
);

const styles = StyleSheet.create({ fill: { flex: 1, minWidth: 0 } });

export default StateFade;
