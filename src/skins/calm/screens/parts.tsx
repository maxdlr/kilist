import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import type { SwipeGameType } from "@/providers/SwipeFoodsProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { Href, router } from "expo-router";
import { ReactNode, useMemo } from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useSWR from "swr";
import { calmPalette as C } from "..";

type Weight = "regular" | "medium" | "semibold";

export const CText = ({
  weight = "regular",
  size,
  color = C.ink,
  style,
  ...rest
}: TextProps & { weight?: Weight; size?: number; color?: string; style?: StyleProp<TextStyle> }) => {
  const skin = useSkin();
  const fontSize = size ?? skin.type.body;
  const family = weight === "semibold" ? skin.fonts.body!.bold : weight === "medium" ? skin.fonts.body!.medium : skin.fonts.body!.regular;
  return (
    <Text style={[{ color, fontFamily: family, fontSize, lineHeight: Math.round(fontSize * 1.38) }, style]} {...rest} />
  );
};

export const CButton = ({
  label,
  onPress,
  href,
  variant = "primary",
  flex,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  href?: Href;
  variant?: "primary" | "secondary" | "text" | "danger";
  flex?: number;
  accessibilityLabel?: string;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const look = {
    primary: { fill: C.ink, ink: C.ground, line: C.ink },
    secondary: { fill: "transparent", ink: C.ink, line: C.field },
    text: { fill: "transparent", ink: C.soft, line: "transparent" },
    danger: { fill: C.danger, ink: C.ground, line: C.danger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress ?? (href ? () => router.navigate(href) : undefined)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: look.fill,
          borderColor: look.line,
          height: variant === "text" ? skin.size.button.xs : skin.size.button.lg,
          opacity: pressed ? skin.shape.pressedOpacity : 1,
        },
        flex !== undefined && { flex },
      ]}
    >
      <CText weight={variant === "text" ? "regular" : "medium"} size={variant === "text" ? skin.type.label + 1 : skin.type.body} color={look.ink} numberOfLines={1}>
        {label}
      </CText>
    </Pressable>
  );
};

export const Screen = ({
  children,
  dock,
  padded = true,
}: {
  children: ReactNode;
  dock?: ReactNode;
  padded?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { insideTabs } = useTabBarVisibility();
  useStatusBarStyle(skin.statusBarOnGround);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.content,
          padded && styles.padded,
          { paddingTop: insets.top + skin.spacing.page - skin.spacing.small },
          !dock && !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom },
        ]}
      >
        {children}
      </View>
      {dock && (
        <View style={[styles.dock, !insideTabs && { paddingBottom: skin.spacing.stack + insets.bottom }]}>{dock}</View>
      )}
    </View>
  );
};

export const Dot = ({ color, size = 8 }: { color: string; size?: number }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={{ backgroundColor: color, borderRadius: size / 2, height: size, width: size }}
  />
);

export const useCheckPending = () => {
  const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  const { data: foods } = useSWR<FoodType[]>({ url: "foods/swipe/browse" });
  const { data: game } = useSWR<SwipeGameType>({ url: "swipe-list/game", params: { tzOffset } });
  const count = foods?.length ?? 0;
  return { count, pending: count > 0 && game?.playedToday === false };
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
    content: { flex: 1, gap: s.spacing.section + 4, minHeight: 0 },
    padded: { paddingHorizontal: s.spacing.gutter },
    dock: { gap: s.spacing.small + 2, paddingBottom: s.spacing.stack, paddingHorizontal: s.spacing.gutter, paddingTop: s.spacing.small },
    button: {
      alignItems: "center",
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      justifyContent: "center",
      paddingHorizontal: s.spacing.stack,
    },
  });
