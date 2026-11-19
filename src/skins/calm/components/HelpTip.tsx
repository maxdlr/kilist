import Press from "@/components/elements/Press";
import { InfoCircleIcon, InfoCircleSolidIcon } from "@/components/icons";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import withPressed from "@/utils/withPressed";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useCalmColors } from "../theme/useCalmColors";
import { CText } from "./CText";

const HINT_SLIDE = 28;
const AUTO_SHOW_MS = 3000;

type Props = {
  text: string;
  accessibilityLabel: string;
  activity?: unknown;
};

export const HelpTip = ({ text, accessibilityLabel, activity }: Props) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const [shown, setShown] = useState(false);
  const [focused, setFocused] = useState(false);
  const touched = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hint = useSharedValue(0);
  const hintStyle = useAnimatedStyle(() => ({
    opacity: hint.value,
    transform: [{ translateX: (1 - hint.value) * HINT_SLIDE }],
  }));

  useEffect(() => {
    hint.set(withTiming(shown ? 1 : 0, AnimationService.config));
  }, [shown, hint]);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        if (timer.current) clearTimeout(timer.current);
        hint.set(0);
        touched.current = false;
        setFocused(false);
        setShown(false);
      };
    }, [hint]),
  );

  useEffect(() => {
    if (touched.current || !focused) return;
    timer.current = setTimeout(() => {
      if (!touched.current) setShown(true);
    }, AUTO_SHOW_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [activity, focused]);

  const toggle = () => {
    touched.current = true;
    setShown((value) => !value);
  };

  return (
    <View style={styles.cluster}>
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden={!shown}
        importantForAccessibility={shown ? "auto" : "no-hide-descendants"}
        style={[styles.hint, hintStyle]}
      >
        <CText size={12} color={C.textSoft} accessibilityLiveRegion="polite" numberOfLines={2} style={styles.hintText}>
          {text}
        </CText>
      </Animated.View>
      <Press
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: shown }}
        hitSlop={skin.spacing.small}
        onPress={toggle}
        style={withPressed(styles.info)}
      >
        {shown ? (
          <InfoCircleSolidIcon size={skin.size.icon.action + 2} color={C.text} />
        ) : (
          <InfoCircleIcon size={skin.size.icon.action + 2} color={C.textSoft} strokeWidth={1.6} />
        )}
      </Press>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    cluster: { alignItems: "center", flexDirection: "row", flexShrink: 1, gap: s.spacing.small, minWidth: 0 },
    hint: { flexShrink: 1, minWidth: 0 },
    hintText: { textAlign: "right" },
    info: {
      alignItems: "center",
      height: s.size.button.xs,
      justifyContent: "center",
      width: s.size.button.xs,
    },
  });
