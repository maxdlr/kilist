import Svg, { Path } from "react-native-svg";

const BarcodeIcon = ({ size, color, strokeWidth = 1.8 }: { size: number; color: string; strokeWidth?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
    <Path d="M3 7V5a1 1 0 0 1 1-1h2M18 4h2a1 1 0 0 1 1 1v2M21 17v2a1 1 0 0 1-1 1h-2M6 20H4a1 1 0 0 1-1-1v-2" />
    <Path d="M7 8v8M10 8v8M12.5 8v8M15 8v8M17 8v8" />
  </Svg>
);

export default BarcodeIcon;
