import common from "@/i18n/common";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import type { PasswordRule } from "@/utils/passwordRules";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { hintAnimation } from "./authLook";

const BADGE = 30;
const BADGE_GLYPH = 14;
const MATCH_GLYPH = "=";

const RuleBadge = ({ met, label, glyph, ink }: { met: boolean; label: string; glyph: string; ink: string }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const { fill: done, ink: onDone } = skin.actions.primary;
  const idleLine = skin.colors.fieldLine ?? ink;
  const font = { fontFamily: skin.fonts.body?.bold ?? skin.fonts.mono };
  const filled = useSharedValue(met ? 1 : 0);
  const onStyle = useAnimatedStyle(() => ({
    opacity: filled.value,
    transform: [{ scale: 0.6 + 0.4 * filled.value }],
  }));
  const lineStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(filled.value, [0, 1], [idleLine, done]),
  }));

  useEffect(() => {
    filled.set(withTiming(met ? 1 : 0, { duration: AnimationService.enter.duration, easing: AnimationService.easeOut }));
  }, [met, filled]);

  return (
    <Animated.View
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked: met }}
      accessibilityLabel={label}
      style={[styles.badge, lineStyle]}
    >
      <Text allowFontScaling={false} style={[styles.glyph, styles.idle, font, { color: ink }]}>
        {glyph}
      </Text>
      <Animated.View style={[styles.on, { backgroundColor: done }, onStyle]}>
        <Text allowFontScaling={false} style={[styles.glyph, font, { color: onDone }]}>
          {glyph}
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const PasswordRules = ({
  rules,
  showMatch,
  match,
  ink,
}: {
  rules: PasswordRule[];
  showMatch: boolean;
  match: boolean;
  ink: string;
}) => {
  const styles = useSkinStyles(createStyles);
  return (
    <View style={styles.rules}>
      {rules.map((rule) => (
        <RuleBadge
          key={rule.id}
          met={rule.met}
          glyph={rule.glyph}
          label={rule.id === "length" ? common.passwordRules.length(rule.min) : common.passwordRules[rule.id]}
          ink={ink}
        />
      ))}
      {showMatch && (
        <Animated.View {...hintAnimation}>
          <RuleBadge met={match} glyph={MATCH_GLYPH} label={common.passwordRules.match} ink={ink} />
        </Animated.View>
      )}
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    rules: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s.spacing.small,
      justifyContent: "center",
      paddingTop: s.spacing.small,
    },
    badge: {
      alignItems: "center",
      borderRadius: BADGE / 2,
      borderWidth: Math.max(1, s.shape.border),
      height: BADGE,
      justifyContent: "center",
      overflow: "hidden",
      width: BADGE,
    },
    idle: { opacity: 0.45 },
    on: {
      ...StyleSheet.absoluteFill,
      alignItems: "center",
      borderRadius: BADGE / 2,
      justifyContent: "center",
    },
    glyph: {
      fontSize: BADGE_GLYPH,
      includeFontPadding: false,
      lineHeight: BADGE_GLYPH + 2,
      textAlign: "center",
      textAlignVertical: "center",
    },
  });

export default PasswordRules;
