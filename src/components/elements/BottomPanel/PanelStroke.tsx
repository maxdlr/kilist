import { useSkin } from "@/providers/SkinProvider";
import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

const DEFAULT_MID_POINT = 0.5;
const MIN_MID = 0.001;
const MAX_MID = 0.999;

const outline = (
  width: number,
  height: number,
  radius: number,
  stroke: number,
) => {
  const half = stroke / 2;
  if (radius <= 0) return `M 0 ${half} L ${width} ${half}`;
  const r = Math.max(0, radius - half);
  return [
    `M ${half} ${height}`,
    `L ${half} ${radius}`,
    `A ${r} ${r} 0 0 1 ${radius} ${half}`,
    `L ${width - radius} ${half}`,
    `A ${r} ${r} 0 0 1 ${width - half} ${radius}`,
    `L ${width - half} ${height}`,
  ].join(" ");
};

const PanelStroke = ({ width, height }: { width: number; height: number }) => {
  const skin = useSkin();
  const id = `stroke${useId().replace(/:/g, "")}`;
  const radius = skin.panel.radius;
  const stroke = skin.bottomPanel.border.width ?? (radius > 0 ? skin.shape.border : skin.shape.accentBorder);

  const { start, end, midPoint = DEFAULT_MID_POINT } = skin.bottomPanel.border.gradientStroke;
  const mid = Math.min(MAX_MID, Math.max(MIN_MID, midPoint));

  if (width <= 0 || height <= 0 || stroke <= 0) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient
            id={id}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={width}
            y2={height}
          >
            <Stop offset={0} stopColor={start} stopOpacity={1} />
            <Stop offset={mid} stopColor={start} stopOpacity={0.5} />
            <Stop offset={1} stopColor={start} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path
          d={outline(width, height, radius, stroke)}
          stroke={end}
          strokeWidth={stroke}
          fill="none"
        />
        <Path
          d={outline(width, height, radius, stroke)}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          fill="none"
        />
      </Svg>
    </View>
  );
};

export default PanelStroke;
