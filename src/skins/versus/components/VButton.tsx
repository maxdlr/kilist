import Press from "@/components/elements/Press";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { Href, router } from "expo-router";
import { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { versusPalette as P } from "../theme/palette";
import { VText } from "./VText";

export const VButton = ({
  label,
  onPress,
  href,
  variant = "primary",
  big = false,
  flex,
  accessibilityLabel,
  scale = 1,
  icon,
}: {
  icon?: (color: string) => ReactNode;
  label: string;
  onPress?: () => void;
  href?: Href;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "buy";
  big?: boolean;
  flex?: number;
  accessibilityLabel?: string;
  scale?: number;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const look = {
    primary: { fill: P.action, ink: P.ink, line: P.action },
    secondary: { fill: "transparent", ink: P.white, line: P.white },
    danger: { fill: "transparent", ink: P.danger, line: P.buy },
    ghost: { fill: "transparent", ink: P.white, line: "transparent" },
    buy: { fill: P.buy, ink: P.ink, line: P.buy },
  }[variant];

  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress ?? (href ? () => router.navigate(href) : undefined)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: look.fill,
          borderColor: look.line,
          height: big ? skin.size.button.lg : variant === "ghost" ? skin.size.button.xs : skin.size.button.md,
          opacity: pressed ? skin.shape.pressedOpacity : 1,
          transform: [{ scale }],
        },
        big && variant === "primary" && { boxShadow: `0 5px 0 ${P.actionShadow}` },
        flex !== undefined && { flex },
      ]}
    >
      {icon?.(look.ink)}
      <VText
        face={big ? "display" : "bold"}
        size={big ? skin.type.title : skin.type.body}
        color={look.ink}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {label}
      </VText>
    </Press>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    button: {
      alignItems: "center",
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.tight,
      justifyContent: "center",
      paddingHorizontal: s.spacing.inline,
    },
  });
