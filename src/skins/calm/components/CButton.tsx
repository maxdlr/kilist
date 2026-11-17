import Press from "@/components/elements/Press";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { Href, router } from "expo-router";
import { ReactNode } from "react";
import { useCalmColors } from "../theme/useCalmColors";
import { CText } from "./CText";
import { createButtonStyles } from "./styles";

export const CButton = ({
  label,
  onPress,
  href,
  variant = "primary",
  accessibilityLabel,
  icon,
  small = false,
}: {
  icon?: (color: string) => ReactNode;
  label?: string;
  onPress?: () => void;
  href?: Href;
  variant?: "primary" | "secondary" | "text" | "danger";
  accessibilityLabel?: string;
  small?: boolean;
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

  return (
    <Press
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
          weight={variant === "text" || small ? "regular" : "medium"}
          size={small ? skin.type.label : skin.type.label + 1}
          color={look.ink}
          numberOfLines={1}
        >
          {label}
        </CText>
      )}
    </Press>
  );
};
