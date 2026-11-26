import T from "@/skins/calm/text";
import { SwipeDirection } from "@/components/elements/SwipeDeck";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import AnimationService from "@/services/animation";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components";
import Named from "./Named";

const hintHeight = (s: Skin) => Math.round(s.type.label * 1.38);

const captionGap = (s: Skin) => s.spacing.tight + 2;

const Caption = ({
  title,
  line,
  hint,
  names = [],
}: {
  title: string;
  line?: string;
  hint?: SwipeDirection | null;
  names?: string[];
}) => {
  const skin = useSkin();
  const look = useCalmColors().tutorialCaption;
  const styles = useSkinStyles(createStyles);
  const hintColor: Record<SwipeDirection, string> = look.hint;
  const withHint = hint !== undefined;
  const [shownHint, setShownHint] = useState<SwipeDirection | null>(
    hint ?? null,
  );
  if (hint && hint !== shownHint) setShownHint(hint);
  const shown = useSharedValue(hint ? 1 : 0);
  const shift = (hintHeight(skin) + captionGap(skin)) / 2;

  useEffect(() => {
    shown.set(withTiming(hint ? 1 : 0, AnimationService.config));
  }, [hint, shown]);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withHint ? (1 - shown.value) * shift : 0 }],
  }));
  const hintStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * shift }],
  }));

  return (
    <View accessibilityLiveRegion="polite" style={styles.caption}>
      <Animated.View style={titleStyle}>
        <CText weight="medium" size={skin.type.lead} color={look.title} style={styles.center}>
          <Named text={title} names={names} size={skin.type.lead} color={look.title} />
        </CText>
      </Animated.View>
      {withHint && (
        <Animated.View style={[styles.hintLine, hintStyle]}>
          {shownHint && (
            <CText
              weight="bold"
              size={skin.type.label}
              color={hintColor[shownHint]}
              style={styles.center}
            >
              {T.intent[shownHint]}
            </CText>
          )}
        </Animated.View>
      )}
      {line && (
        <CText size={skin.type.body} color={look.line} style={styles.center}>
          <Named
            text={line}
            names={names}
            size={skin.type.body}
            color={look.line}
          />
        </CText>
      )}
    </View>
  );
};

const createStyles = (s: Skin, L = calmColors(s).tutorialCaption) =>
  StyleSheet.create({
    center: { textAlign: "center" },
    hintLine: { height: hintHeight(s), justifyContent: "center" },
    caption: {
      backgroundColor: L.fill,
      borderColor: L.border,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border,
      gap: captionGap(s),
      padding: s.spacing.stack,
    },
  });

export default Caption;
