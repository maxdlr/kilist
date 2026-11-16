import { View } from "react-native";

export const Dot = ({ color, size = 8 }: { color: string; size?: number }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={{
      backgroundColor: color,
      borderRadius: size / 2,
      height: size,
      width: size,
    }}
  />
);
