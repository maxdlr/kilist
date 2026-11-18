import type { GlassTarget } from "@/providers/TabBarProvider";
import MaskedViewBase from "@react-native-masked-view/masked-view";
import { type ComponentType, type ReactElement, type ReactNode, useId } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import GlassBlur from "./GlassBlur";
import type { SceneGlass } from "./glassSettings";

const MaskedView = MaskedViewBase as unknown as ComponentType<{
  style?: StyleProp<ViewStyle>;
  maskElement: ReactElement;
  children: ReactNode;
}>;

const Feather = ({
  id,
  color,
  from,
  to,
  height,
}: {
  id: string;
  color: string;
  from: number;
  to: number;
  height: number;
}) => (
  <View style={StyleSheet.absoluteFill}>
    {height > 0 && (
      <Svg width="100%" height={height} style={styles.feather}>
        <Defs>
          <LinearGradient id={id} x1={0} y1={0} x2={0} y2={1}>
            <Stop offset={0} stopColor={color} stopOpacity={from} />
            <Stop offset={1} stopColor={color} stopOpacity={to} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    )}
    <View style={[styles.veil, { backgroundColor: color, opacity: to, top: height }]} />
  </View>
);

const FeatheredGlass = ({
  target,
  look,
  veil,
  featherFrom = 0,
}: {
  target: GlassTarget;
  look: SceneGlass;
  veil: string;
  featherFrom?: number;
}) => {
  const id = useId().replace(/:/g, "");
  const featherLeft = Math.max(0, look.feather - featherFrom);
  const featherStart = look.feather > 0 ? 1 - featherLeft / look.feather : 1;
  const blur = <GlassBlur target={target} settings={look} />;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={StyleSheet.absoluteFill}>
        {featherLeft > 0 ? (
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={<Feather id={`mask${id}`} color="black" from={featherStart} to={1} height={featherLeft} />}
          >
            {blur}
          </MaskedView>
        ) : (
          blur
        )}
      </View>
      <Feather
        id={`veil${id}`}
        color={veil}
        from={featherStart * look.veil}
        to={look.veil}
        height={featherLeft}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  feather: { left: 0, position: "absolute", right: 0, top: 0 },
  veil: { bottom: 0, left: 0, position: "absolute", right: 0 },
});

export default FeatheredGlass;
