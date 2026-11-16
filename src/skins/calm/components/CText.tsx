import { useSkin } from "@/providers/SkinProvider";
import { StyleProp, Text, TextProps, TextStyle } from "react-native";
import { useCalmColors } from "../theme/useCalmColors";

export type Weight = "regular" | "medium" | "semibold" | "bold" | "black";

export const CText = ({
  weight = "regular",
  size,
  color,
  style,
  ...rest
}: TextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const fontSize = size ?? skin.type.body;
  const family =
    weight === "black"
      ? (skin.fonts.body!.black ??
        skin.fonts.body!.heavy ??
        skin.fonts.body!.bold)
      : weight === "bold"
        ? (skin.fonts.body!.heavy ?? skin.fonts.body!.bold)
        : weight === "semibold"
          ? skin.fonts.body!.bold
          : weight === "medium"
            ? skin.fonts.body!.medium
            : skin.fonts.body!.regular;
  return (
    <Text
      style={[
        {
          color: color ?? C.text,
          fontFamily: family,
          fontSize,
          lineHeight: Math.round(fontSize * 1.38),
        },
        style,
      ]}
      {...rest}
    />
  );
};
