import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { ActionColors, ActionKind, Skin } from "@/skins/types";
import { Href, router } from "expo-router";
import { ReactNode } from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

const KilButton = ({
  label,
  onTouch,
  href,
  variant = "primary",
  height,
  fontSize,
  flex,
  icon,
  accessibilityLabel,
  colors,
  style,
}: {
  label: string;
  onTouch?: () => void;
  href?: Href;
  variant?: ActionKind;
  height?: number;
  fontSize?: number;
  flex?: number;
  icon?: (color: string) => ReactNode;
  accessibilityLabel?: string;
  colors?: ActionColors;
  style?: StyleProp<ViewStyle>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { fill, ink, line } = colors ?? skin.actions[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onTouch ?? (href ? () => router.navigate(href) : undefined)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: fill,
          borderColor: line,
          borderRadius: skin.shape.radius,
          borderWidth: skin.shape.border,
          height: height ?? skin.size.button.lg,
        },
        flex !== undefined && { flex },
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon?.(ink)}
      <ThemedText
        adjustsFontSizeToFit
        allowFontScaling={false}
        minimumFontScale={0.5}
        numberOfLines={1}
        size={fontSize ?? skin.type.title}
        color={ink}
        style={styles.label}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    button: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
      justifyContent: "center",
      paddingHorizontal: s.spacing.small,
    },
    pressed: {
      opacity: s.shape.pressedOpacity,
    },
    label: {
      includeFontPadding: false,
    },
  });

export default KilButton;
