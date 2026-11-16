import { useSkin } from "@/providers/SkinProvider";
import { StyleProp, Text, TextProps, TextStyle } from "react-native";
import { versusPalette as P } from "../theme/palette";

export type Face = "body" | "medium" | "bold" | "pixel" | "display";

export const VText = ({
  face = "body",
  size,
  color = P.white,
  style,
  ...rest
}: TextProps & { face?: Face; size?: number; color?: string; style?: StyleProp<TextStyle> }) => {
  const skin = useSkin();
  const fontSize = size ?? skin.type.body;
  const family =
    face === "pixel"
      ? skin.fonts.pixel!
      : face === "display"
        ? skin.fonts.display.family
        : face === "bold"
          ? skin.fonts.body!.bold
          : face === "medium"
            ? skin.fonts.body!.medium
            : skin.fonts.body!.regular;
  const ratio = face === "pixel" ? 1.4 : face === "display" ? skin.fonts.display.lineHeight : 1.35;

  return (
    <Text
      allowFontScaling={face !== "pixel" && face !== "display"}
      style={[
        { color, fontFamily: family, fontSize, lineHeight: Math.round(fontSize * ratio) },
        style,
      ]}
      {...rest}
    />
  );
};
