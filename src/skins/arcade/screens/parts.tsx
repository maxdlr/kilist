import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { arcadePalette as P } from "..";

export const shadowOf = (skin: Skin, extra = 0, color = P.navy) =>
  `0 ${skin.shape.shadow.offset + extra}px 0 ${color}`;

export const ArcadeCard = ({
  children,
  fill = P.white,
  lift = 0,
  dashed = false,
  style,
}: {
  children: ReactNode;
  fill?: string;
  lift?: number;
  dashed?: boolean;
  style?: StyleProp<ViewStyle>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: fill },
        dashed ? styles.dashed : { boxShadow: shadowOf(skin, lift) },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const TicketIcon = ({ size, color = P.navy }: { size: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"
      stroke={color}
      strokeWidth={2.4}
      strokeLinejoin="round"
    />
    <Path d="M14 7v10" stroke={color} strokeWidth={2.4} strokeDasharray="2 2" />
  </Svg>
);

export const TicketChip = ({ count }: { count: number }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <View
      accessible
      accessibilityLabel={`Your balance: ${count} tickets`}
      style={[styles.chip, { boxShadow: shadowOf(skin, -1) }]}
    >
      <TicketIcon size={skin.size.check - skin.spacing.tight} />
      <ThemedText size={skin.type.lead} color={P.navy}>
        {String(count)}
      </ThemedText>
    </View>
  );
};

export const Row = ({
  left,
  right,
  size,
  color = P.navy,
}: {
  left: string;
  right: string;
  size: number;
  color?: string;
}) => {
  const styles = useSkinStyles(createStyles);

  return (
    <View style={styles.row}>
      <ThemedText size={size} color={color}>
        {left}
      </ThemedText>
      <ThemedText size={size} color={color}>
        {right}
      </ThemedText>
    </View>
  );
};

export const Rule = () => {
  const skin = useSkin();
  return (
    <View
      style={{
        backgroundColor: P.navy,
        borderRadius: skin.shape.divider,
        height: skin.shape.divider,
      }}
    />
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    card: {
      borderColor: P.navy,
      borderRadius: s.shape.radius + s.spacing.tight,
      borderWidth: s.shape.border,
    },
    dashed: {
      borderStyle: "dashed",
    },
    chip: {
      alignItems: "center",
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: s.shape.radius - s.spacing.small,
      borderWidth: s.shape.border,
      flexDirection: "row",
      gap: s.spacing.small,
      paddingHorizontal: s.spacing.dock,
      paddingVertical: s.spacing.small,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });
