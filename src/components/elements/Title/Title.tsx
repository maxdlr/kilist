import { useSkin } from "@/providers/SkinProvider";
import { fitFontSize } from "@/utils/fitText";
import { useMemo, useState } from "react";
import {
  StyleProp,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

const Title = ({
  children,
  size,
  minSize,
  lines = 4,
  color,
  header = true,
  gutter,
  style,
  textStyle,
}: {
  children: string;
  size?: number;
  minSize?: number;
  lines?: number;
  color?: string;
  header?: boolean;
  gutter?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}) => {
  const skin = useSkin();
  const { width: windowWidth } = useWindowDimensions();
  const [width, setWidth] = useState(
    windowWidth - (gutter ?? skin.spacing.gutter * 2),
  );

  const fontSize = useMemo(
    () =>
      fitFontSize({
        text: children,
        width,
        maxSize: size ?? skin.type.display.lg,
        minSize: minSize ?? skin.type.caption,
        maxLines: lines,
        font: skin.fonts.display,
      }),
    [children, width, size, minSize, lines, skin],
  );

  return (
    <View
      style={style}
      onLayout={(event) => {
        const measured = event.nativeEvent.layout.width;
        if (Math.abs(measured - width) > 1) setWidth(measured);
      }}
    >
      <Text
        accessibilityRole={header ? "header" : undefined}
        adjustsFontSizeToFit={lines === 1}
        numberOfLines={lines === 1 ? 1 : undefined}
        allowFontScaling={false}
        android_hyphenationFrequency="none"
        textBreakStrategy="simple"
        style={[
          {
            color: color ?? skin.colors.onPaper,
            fontFamily: skin.fonts.display.family,
            fontSize,
            includeFontPadding: false,
            lineHeight: Math.round(fontSize * skin.fonts.display.lineHeight),
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

export default Title;
