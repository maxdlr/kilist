import Svg, { G, Path, Rect } from "react-native-svg";

const BACK_CARD_OPACITY = 0.4;

const KilistMark = ({ size, ink, ground }: { size: number; ink: string; ground: string }) => (
  <Svg width={size} height={size} viewBox="0 0 512 512">
    <Rect width={512} height={512} rx={112} fill={ink} />
    <Rect
      x={171}
      y={149}
      width={170}
      height={214}
      rx={24}
      fill="none"
      stroke={ground}
      strokeOpacity={BACK_CARD_OPACITY}
      strokeWidth={13}
      transform="rotate(-11 256 256)"
    />
    <G transform="rotate(10 256 256)">
      <Rect x={173} y={149} width={166} height={214} rx={24} fill={ground} />
      <Path
        d="M214 258L242 286L297 233"
        fill="none"
        stroke={ink}
        strokeWidth={22}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  </Svg>
);

export default KilistMark;
