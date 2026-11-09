import V from "../text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import type { Member, RaceAnswer } from "@/hooks/versus/api";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { Href, router } from "expo-router";
import { ReactNode } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { versusPalette as P } from "..";

type Face = "body" | "medium" | "bold" | "pixel" | "display";

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

export const memberColor = (members: Member[], myId: number | undefined, userId: number) => {
  if (userId === myId) return P.you;
  const mates = members.filter((member) => member.id !== myId);
  const index = Math.max(0, mates.findIndex((member) => member.id === userId));
  return P.mates[Math.abs(index) % P.mates.length]!;
};

export const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

export const Avatar = ({
  name,
  color,
  size,
  ghost = false,
  dim = false,
}: {
  name: string;
  color: string;
  size: number;
  ghost?: boolean;
  dim?: boolean;
}) => {
  const skin = useSkin();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        alignItems: "center",
        backgroundColor: ghost ? P.ground : color,
        borderColor: color,
        borderRadius: size,
        borderStyle: ghost ? "dashed" : "solid",
        borderWidth: ghost ? skin.shape.border + 1 : 0,
        height: size,
        justifyContent: "center",
        opacity: dim ? 0.5 : 1,
        width: size,
      }}
    >
      <VText face="display" size={size * 0.42} color={ghost ? P.youSoft : P.ink}>
        {initialOf(name)}
      </VText>
    </View>
  );
};

export const Card = ({
  children,
  style,
  line,
  dashed = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  line?: string;
  dashed?: boolean;
}) => {
  const styles = useSkinStyles(createStyles);
  const skin = useSkin();
  return (
    <View
      style={[
        styles.card,
        line && { borderColor: line, borderStyle: dashed ? "dashed" : "solid", borderWidth: skin.shape.border },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const VButton = ({
  label,
  onPress,
  href,
  variant = "primary",
  big = false,
  flex,
  accessibilityLabel,
  scale = 1,
}: {
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
    <Pressable
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
    </Pressable>
  );
};

export const Screen = ({
  children,
  dock,
  scroll = false,
  padded = true,
}: {
  children: ReactNode;
  dock?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  useStatusBarStyle(skin.statusBarOnGround);

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.content,
          padded && styles.padded,
          { paddingTop: insets.top + skin.spacing.top },
          scroll && styles.noGap,
        ]}
      >
        {children}
      </View>
      {dock && <View style={styles.dock}>{dock}</View>}
    </View>
  );
};

export const Kicker = ({ children }: { children: string }) => {
  const skin = useSkin();
  return (
    <VText face="pixel" size={(skin.type.caption - 1) - 3} color={P.muted}>
      {children.toUpperCase()}
    </VText>
  );
};

export const WORD: Record<RaceAnswer, string> = new Proxy({} as Record<RaceAnswer, string>, {
  get: (_, key) => V.word[key as RaceAnswer],
});

export const ANSWER_FILL: Record<RaceAnswer, string> = { in: P.agree, out: P.buy, up: P.line };

export const Chip = ({ label, fill, ink = P.ink, dashed = false }: { label: string; fill: string; ink?: string; dashed?: boolean }) => {
  const skin = useSkin();
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: dashed ? "transparent" : fill,
        borderColor: fill,
        borderRadius: 999,
        borderStyle: dashed ? "dashed" : "solid",
        borderWidth: dashed ? skin.shape.border : 0,
        paddingHorizontal: skin.spacing.small + 2,
        paddingVertical: dashed ? skin.spacing.hair : skin.spacing.tight,
      }}
    >
      <VText face="bold" size={skin.type.caption} color={dashed ? fill : ink}>
        {label}
      </VText>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: {
      backgroundColor: P.ground,
      flex: 1,
    },
    content: {
      flex: 1,
      gap: s.spacing.stack,
      minHeight: 0,
    },
    padded: {
      paddingHorizontal: s.spacing.gutter,
    },
    noGap: {
      gap: 0,
    },
    dock: {
      gap: s.spacing.small,
      paddingBottom: 0,
      paddingHorizontal: s.spacing.gutter,
      paddingTop: s.spacing.section,
    },
    card: {
      backgroundColor: P.panel,
      borderRadius: s.shape.radius + s.spacing.hair,
      gap: s.spacing.inline,
      padding: s.spacing.stack,
    },
    button: {
      alignItems: "center",
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      justifyContent: "center",
      paddingHorizontal: s.spacing.inline,
    },
  });
