import { useSkin } from "@/providers/SkinProvider";
import { Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  size?: number;
  color?: string;
  mono?: boolean;
};

export function ThemedText({
  style,
  size,
  color,
  mono = false,
  ...rest
}: ThemedTextProps) {
  const skin = useSkin();

  return (
    <Text
      style={[
        {
          color: color ?? skin.colors.onPaper,
          fontFamily: mono ? skin.fonts.mono : skin.fonts.display.family,
          fontSize: size ?? skin.type.body,
          lineHeight: Math.round(
            (size ?? skin.type.body) * (mono ? 1.45 : 1.3),
          ),
        },
        style,
      ]}
      {...rest}
    />
  );
}
