import Press from "@/components/elements/Press";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { ActionColors, ActionKind, Skin } from "@/skins/types";
import { Href, router } from "expo-router";
import { createContext, ReactNode, useContext } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

export const ButtonKindOverride = createContext<ActionKind | null>(null);

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
  disabled = false,
  small = false,
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
  disabled?: boolean;
  small?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const override = useContext(ButtonKindOverride);
  const kind = override && variant !== "danger" ? override : variant;
  const { fill, ink, line } = colors ?? skin.actions[kind];
  const pill = skin.shape.pill === true;

  return (
    <Press
      accessibilityRole="button"
      scale={skin.shape.shadow.offset === 0}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
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
        pill && styles.pill,
        small && (pill ? styles.smallPill : { height: skin.size.button.sm }),
        skin.shape.shadow.offset > 0 &&
          line !== "transparent" && {
            boxShadow: `0 ${pressed ? 1 : skin.shape.shadow.offset}px 0 ${skin.shape.shadow.color}`,
            transform: [
              { translateY: pressed ? skin.shape.shadow.offset - 1 : 0 },
            ],
          },
        flex !== undefined && !pill && { flex },
        pressed && skin.shape.shadow.offset === 0 && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon?.(ink)}
      <ThemedText
        adjustsFontSizeToFit
        allowFontScaling={false}
        minimumFontScale={0.5}
        numberOfLines={1}
        size={small ? skin.type.label : pill ? skin.type.label + 1 : (fontSize ?? skin.type.title)}
        color={ink}
        style={styles.label}
      >
        {label}
      </ThemedText>
    </Press>
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
    pill: {
      alignSelf: "center",
      borderRadius: s.size.button.xs / 2,
      gap: s.spacing.tight + 2,
      height: s.size.button.xs,
      paddingHorizontal: s.spacing.stack,
    },
    pressed: {
      opacity: s.shape.pressedOpacity,
    },
    smallPill: {
      borderRadius: (s.size.button.xs - 8) / 2,
      height: s.size.button.xs - 8,
    },
    disabled: {
      opacity: 0.4,
    },
    label: {
      includeFontPadding: false,
    },
  });

export default KilButton;
