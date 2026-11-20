import Press from "@/components/elements/Press";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { Href, router } from "expo-router";
import AnimationService from "@/services/animation";
import { ReactNode, useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
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
  disabled = false,
}: {
  icon?: (color: string) => ReactNode;
  disabled?: boolean;
  label?: string;
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
  const height = big ? skin.size.button.lg : variant === "ghost" ? skin.size.button.xs : skin.size.button.md;
  const held = skin.feedback.held.opacity;
  const dim = useSharedValue(disabled ? held : 1);

  useEffect(() => {
    dim.set(withTiming(disabled ? held : 1, AnimationService.feedback.tint));
  }, [disabled, held, dim]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value }));

  return (
    <Animated.View style={[dimStyle, flex !== undefined && { flex }]}>
    <Press
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress ?? (href ? () => router.navigate(href) : undefined)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: look.fill,
          borderColor: look.line,
          height,
          ...(!label && { paddingHorizontal: 0, width: height }),
          opacity: pressed ? skin.shape.pressedOpacity : 1,
          transform: [{ scale }],
        },
        big && variant === "primary" && { boxShadow: `0 5px 0 ${P.actionShadow}` },
        flex !== undefined && { flex: 1 },
      ]}
    >
      {icon?.(look.ink)}
      {label ? (
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
      ) : null}
    </Press>
    </Animated.View>
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
