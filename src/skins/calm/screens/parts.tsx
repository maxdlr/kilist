import Press from "@/components/elements/Press";
import type { SwipeDirection } from "@/components/elements/SwipeDeck/SwipeDeck";
import withPressed from "@/utils/withPressed";
import T from "../text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useTabBarVisibility } from "@/providers/TabBarProvider";
import type { SwipeGameType } from "@/providers/SwipeFoodsProvider";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { FoodType } from "@/types/model";
import { Href, router } from "expo-router";
import { ReactNode, useMemo } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
} from "react-native";
import { CheckIcon, QuestionMarkCircleIcon, ShoppingCartIcon } from "react-native-heroicons/outline";
import {
  QuestionMarkCircleIcon as QuestionMarkCircleSolid,
  ShoppingCartIcon as ShoppingCartSolid,
} from "react-native-heroicons/solid";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useSWR from "swr";
import { calmColors, useCalmColors } from "./colors";

type Weight = "regular" | "medium" | "semibold";

export const CText = ({
  weight = "regular",
  size,
  color,
  style,
  ...rest
}: TextProps & {
  weight?: Weight;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const fontSize = size ?? skin.type.body;
  const family =
    weight === "semibold"
      ? skin.fonts.body!.bold
      : weight === "medium"
        ? skin.fonts.body!.medium
        : skin.fonts.body!.regular;
  return (
    <Text
      style={[
        {
          color: color ?? C.text,
          fontFamily: family,
          fontSize,
          lineHeight: Math.round(fontSize * 1.38),
        },
        style,
      ]}
      {...rest}
    />
  );
};

export const CButton = ({
  label,
  onPress,
  href,
  variant = "primary",
  flex,
  accessibilityLabel,
  icon,
}: {
  icon?: (color: string) => ReactNode;
  label: string;
  onPress?: () => void;
  href?: Href;
  variant?: "primary" | "secondary" | "text" | "danger";
  flex?: number;
  accessibilityLabel?: string;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const look = {
    primary: { fill: C.fill, ink: C.onFill, line: C.fill },
    secondary: { fill: "transparent", ink: C.text, line: C.fieldLine },
    text: { fill: "transparent", ink: C.textSoft, line: "transparent" },
    danger: { fill: C.danger, ink: C.onFill, line: C.danger },
  }[variant];

  return (
    <Press
      accessibilityRole="button"
      scale={variant !== "text"}
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress ?? (href ? () => router.navigate(href) : undefined)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: look.fill,
          borderColor: look.line,
          height:
            variant === "text" ? skin.size.button.xs : skin.size.button.lg,
          opacity: pressed ? skin.shape.pressedOpacity : 1,
        },
        flex !== undefined && { flex },
      ]}
    >
      {icon?.(look.ink)}
      <CText
        weight={variant === "text" ? "regular" : "medium"}
        size={variant === "text" ? skin.type.label + 1 : skin.type.body}
        color={look.ink}
        numberOfLines={1}
      >
        {label}
      </CText>
    </Press>
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
          !dock &&
            !insideTabs && {
              paddingBottom: skin.spacing.stack + insets.bottom,
            },
        ]}
      >
        {children}
      </View>
      {dock && (
        <View
          style={[
            styles.dock,
            !insideTabs && {
              paddingBottom: skin.spacing.stack + insets.bottom,
            },
          ]}
        >
          {dock}
        </View>
      )}
    </View>
  );
};

export const Dot = ({ color, size = 8 }: { color: string; size?: number }) => (
  <View
    accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants"
    style={{
      backgroundColor: color,
      borderRadius: size / 2,
      height: size,
      width: size,
    }}
  />
);

export const StockBars = ({
  rows,
  total: outOf,
}: {
  rows: { label: string; count: number; color: string; icon?: ReactNode }[];
  total?: number;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const total = outOf ?? rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <View style={styles.bars}>
      {rows
        .filter(({ count }) => !!count)
        .map((row) => (
          <View
            key={row.label}
            accessible
            accessibilityLabel={`${row.label}, ${row.count}`}
            style={styles.barRow}
          >
            <View style={styles.barLabel}>{row.icon}</View>

            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: row.color,
                    width: `${total ? Math.round((row.count / total) * 100) : 0}%`,
                  },
                ]}
              />
            </View>

            <CText size={skin.type.label + 1} color={C.textSoft}>
              {String(row.count)}
            </CText>
          </View>
        ))}
    </View>
  );
};

export const CardPads = ({
  intent,
  labels,
  onFling,
}: {
  intent: SwipeDirection | null;
  labels: boolean;
  onFling?: (direction: SwipeDirection) => void;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.swipe;
  const live = onFling !== undefined;

  const pad = (direction: "left" | "right", label: string, aria: string) => {
    const on = intent === direction;
    return (
      <Press
        accessibilityRole="button"
        accessibilityLabel={aria}
        scale
        disabled={!live}
        onPress={() => onFling?.(direction)}
        style={({ pressed }) => [
          styles.pad,
          { backgroundColor: on ? C.fill : C.tint, opacity: pressed ? skin.shape.pressedOpacity : 1 },
        ]}
      >
        {direction === "left" &&
          (on ? (
            <ShoppingCartSolid size={20} color={C.onFill} />
          ) : (
            <ShoppingCartIcon size={20} color={C.text} strokeWidth={1.8} />
          ))}
        {labels && (
          <CText weight="medium" size={skin.type.body} color={on ? C.onFill : C.text} numberOfLines={1}>
            {label}
          </CText>
        )}
        {direction === "right" && <CheckIcon size={20} color={on ? C.onFill : C.positive} strokeWidth={on ? 3 : 2} />}
      </Press>
    );
  };

  return (
    <View
      accessibilityElementsHidden={!live}
      importantForAccessibility={live ? "auto" : "no-hide-descendants"}
      style={styles.pads}
    >
      {pad("left", copy.out, T.play.ariaOut)}
      <Press
        accessibilityRole="button"
        accessibilityLabel={T.intent.up}
        disabled={!live}
        onPress={() => onFling?.("up")}
        style={withPressed(styles.unsure)}
      >
        {intent === "up" ? (
          <QuestionMarkCircleSolid size={22} color={C.text} />
        ) : (
          <QuestionMarkCircleIcon size={22} color={C.textSoft} strokeWidth={1.8} />
        )}
        {labels && (
          <CText size={skin.type.caption} color={intent === "up" ? C.text : C.textSoft}>
            {copy.unsure}
          </CText>
        )}
      </Press>
      {pad("right", copy.inStock, T.play.ariaIn)}
    </View>
  );
};

export const useCheckPending = () => {
  const tzOffset = useMemo(() => new Date().getTimezoneOffset(), []);
  const { data: foods } = useSWR<FoodType[]>({ url: "foods/swipe/browse" });
  const { data: game } = useSWR<SwipeGameType>({
    url: "swipe-list/game",
    params: { tzOffset },
  });
  const count = foods?.length ?? 0;
  return { count, pending: count > 0 && game?.playedToday === false };
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    root: { backgroundColor: C.ground, flex: 1 },
    content: { flex: 1, gap: s.spacing.section + 4, minHeight: 0 },
    padded: { paddingHorizontal: s.spacing.gutter },
    pads: { alignItems: "center", flexDirection: "row", gap: s.spacing.small, padding: s.spacing.inline },
    pad: {
      alignItems: "center",
      borderRadius: s.size.button.lg / 2,
      flex: 1,
      flexDirection: "row",
      gap: s.spacing.small,
      height: s.size.button.lg,
      justifyContent: "center",
      paddingHorizontal: s.spacing.inline,
    },
    unsure: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: s.size.button.xs,
      minWidth: s.size.button.xs,
      paddingHorizontal: s.spacing.tight,
    },
    bars: { gap: s.spacing.inline },
    barRow: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
    },
    barLabel: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
    },
    barTrack: {
      flex: 1,
      backgroundColor: C.line,
      borderRadius: 3,
      height: 6,
      overflow: "hidden",
    },
    barFill: { borderRadius: 3, height: 6 },
    dock: {
      gap: s.spacing.small + 2,
      paddingBottom: s.spacing.stack,
      paddingHorizontal: s.spacing.gutter,
      paddingTop: s.spacing.small,
    },
    button: {
      alignItems: "center",
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.small,
      justifyContent: "center",
      paddingHorizontal: s.spacing.stack,
    },
  });
