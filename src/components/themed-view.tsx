import { View, type ViewProps } from "react-native";

import { ThemeColor } from "@/constants/theme";

export type ThemedViewProps = ViewProps & {
  ref?: React.RefObject<View | null>;
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({
  ref,
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedViewProps) {
  return <View ref={ref} style={[style]} {...otherProps} />;
}
