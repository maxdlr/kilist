import Press from "@/components/elements/Press";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { Href, router } from "expo-router";
import AnimationService from "@/services/animation";
import { ReactNode, useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useCalmColors } from "../theme/useCalmColors";
import { CText } from "./CText";
import { createButtonStyles } from "./styles";

export const CButton = ({
  label,
  onPress,
  href,
  variant = "primary",
  bold = false,
  accessibilityLabel,
  icon,
  small = false,
  disabled = false,
}: {
  disabled?: boolean;
  icon?: (color: string) => ReactNode;
  label?: string;
  onPress?: () => void;
  href?: Href;
  variant?: "primary" | "secondary" | "text" | "danger";
  accessibilityLabel?: string;
  small?: boolean;
  bold?: boolean;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createButtonStyles);
  const look = {
    primary: { fill: C.fill, ink: C.onFill, line: C.fill },
    secondary: { fill: "transparent", ink: C.text, line: C.fieldLine },
    text: { fill: "transparent", ink: C.textSoft, line: "transparent" },
    danger: { fill: C.danger, ink: C.onFill, line: C.danger },
  }[variant];
  const round = !label;
  const held = skin.feedback.held.opacity;
  const dim = useSharedValue(disabled ? held : 1);

  useEffect(() => {
    dim.set(withTiming(disabled ? held : 1, AnimationService.feedback.tint));
  }, [disabled, held, dim]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value }));

  return (
    <Animated.View style={dimStyle}>
    <Press
      disabled={disabled}
      accessibilityState={{ disabled }}
      accessibilityRole="button"
      scale={variant !== "text"}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress ?? (href ? () => router.navigate(href) : undefined)}
      style={({ pressed }) => [
        styles.button,
        round ? styles.round : styles.pill,
        small && styles.small,
        {
          backgroundColor: look.fill,
          borderColor: look.line,
          opacity: pressed ? skin.shape.pressedOpacity : 1,
        },
      ]}
    >
      {icon?.(look.ink)}
      {label && (
        <CText
          weight={
            bold ? "black" : variant === "text" ? "medium" : small ? "semibold" : "bold"
          }
          size={small ? skin.type.label : skin.type.label + 1}
          color={look.ink}
          numberOfLines={1}
        >
          {label}
        </CText>
      )}
    </Press>
    </Animated.View>
  );
};
