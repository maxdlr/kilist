import { CartIcon, ClockIcon, type Icon } from "@/components/icons";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import T from "@/skins/calm/text";
import { useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components";

const TINT = {
  transitionDuration: AnimationService.feedback.tint.duration,
  transitionProperty: ["backgroundColor"] as string[],
  transitionTimingFunction: "ease-out",
};

const Box = ({
  icon: Glyph,
  label,
  count,
  armed,
  armedFill,
}: {
  icon: Icon;
  label: string;
  count: number;
  armed: boolean;
  armedFill: string;
}) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const bump = useSharedValue(0);
  const last = useRef(count);

  useEffect(() => {
    if (count > last.current) {
      bump.set(withSequence(withTiming(1, { duration: 140 }), withSpring(0, AnimationService.settle)));
    }
    last.current = count;
  }, [count, bump]);

  const bumpStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + bump.value * 0.06 }] }));

  return (
    <Animated.View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label}, ${count}`}
      accessibilityLiveRegion="polite"
      style={[styles.box, { backgroundColor: armed ? armedFill : C.tint }, TINT, bumpStyle]}
    >
      <Glyph size={skin.type.body} color={C.textSoft} strokeWidth={1.8} />
      <CText size={skin.type.caption} color={C.textSoft} numberOfLines={1} style={styles.label}>
        {label}
      </CText>
      <View style={styles.countBox}>
        <Animated.View
          key={count}
          entering={FadeInDown.duration(AnimationService.enter.duration)}
          exiting={FadeOutUp.duration(AnimationService.exit.duration)}
        >
          <CText size={skin.type.title} weight="medium">
            {count}
          </CText>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const RunBoxes = ({
  later,
  basket,
  laterArmed,
  basketArmed,
}: {
  later: number;
  basket: number;
  laterArmed: boolean;
  basketArmed: boolean;
}) => {
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  return (
    <View style={styles.row}>
      <Box icon={ClockIcon} label={T.shop.nextTime} count={later} armed={laterArmed} armedFill={C.fieldLine} />
      <Box icon={CartIcon} label={T.shop.inBasket} count={basket} armed={basketArmed} armedFill={`${C.success}33`} />
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: s.spacing.inline - 2,
      paddingBottom: s.spacing.inline,
      paddingHorizontal: s.spacing.gutter,
    },
    box: {
      alignItems: "center",
      borderRadius: s.shape.radius + s.spacing.tight,
      flex: 1,
      flexDirection: "row",
      gap: s.spacing.small,
      minHeight: s.size.row.shop,
      paddingHorizontal: s.spacing.stack,
    },
    label: { flex: 1, minWidth: 0 },
    countBox: { minWidth: s.spacing.section, alignItems: "flex-end" },
  });

export default RunBoxes;
