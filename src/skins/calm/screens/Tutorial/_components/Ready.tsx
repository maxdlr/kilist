import Press from "@/components/elements/Press";
import { ArcadeIcon, CartIcon, CheckCircleIcon, PlayIcon } from "@/components/icons";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import T from "@/skins/calm/text";
import { CText, Screen } from "@/skins/calm/components";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import type { Skin } from "@/skins/types";
import withPressed from "@/utils/withPressed";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { StepNav } from "./shared";
import TopBar from "./TopBar";

const BADGE = 64;
const GO = 96;
const STAGGER = 140;
const BREATHE_MS = 1100;
const STEPS = [PlayIcon, CartIcon, CheckCircleIcon];

const rise = (index: number) =>
  FadeInDown.duration(AnimationService.enter.duration * 2)
    .easing(AnimationService.easeOut)
    .delay(index * STAGGER);

const Ready = ({ cards, onGo, onBack, onExit }: StepNav & { cards: number; onGo: () => void }) => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const copy = T.tutorial;
  const reduced = useReducedMotion();
  const breathe = useSharedValue(1);
  const textDelay = STEPS.length * STAGGER;

  useEffect(() => {
    if (reduced) return;
    breathe.set(
      withDelay(
        textDelay + STAGGER * 2,
        withRepeat(
          withSequence(
            withTiming(1.08, { duration: BREATHE_MS, easing: AnimationService.config.easing }),
            withTiming(1, { duration: BREATHE_MS, easing: AnimationService.config.easing }),
          ),
          -1,
        ),
      ),
    );
  }, [reduced, breathe, textDelay]);

  const breatheStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));

  return (
    <Screen>
      <TopBar onBack={onBack} onExit={onExit} />
      <View style={styles.body}>
        <View style={styles.steps}>
          {STEPS.map((Icon, index) => (
            <Animated.View key={index} entering={rise(index)} style={styles.badge}>
              <Icon size={skin.size.icon.action + 6} color={C.text} strokeWidth={1.8} />
            </Animated.View>
          ))}
        </View>
        <Animated.View entering={rise(STEPS.length)} style={styles.head}>
          <CText size={skin.type.label} color={C.textSoft} style={styles.center}>
            {copy.readyLabel}
          </CText>
          <CText weight="medium" size={skin.type.display.md} accessibilityRole="header" style={styles.center}>
            {copy.readyTitle}
          </CText>
          <CText size={skin.type.body} color={C.textSoft} style={styles.center}>
            {copy.readyLine(cards)}
          </CText>
        </Animated.View>
        <Animated.View
          entering={FadeIn.duration(AnimationService.enter.duration * 2).delay(textDelay + STAGGER)}
          style={styles.goSlot}
        >
          <Animated.View style={breatheStyle}>
            <Press
              accessibilityRole="button"
              accessibilityLabel={copy.readyGo}
              onPress={onGo}
              style={withPressed(styles.go)}
            >
              <ArcadeIcon size={GO / 2.4} color={C.onFill} strokeWidth={1.8} />
            </Press>
          </Animated.View>
          <CText weight="medium" size={skin.type.label + 1} color={C.text}>
            {copy.readyGo}
          </CText>
        </Animated.View>
      </View>
    </Screen>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    body: { alignItems: "center", flex: 1, gap: s.spacing.section, justifyContent: "center" },
    steps: { flexDirection: "row", gap: s.spacing.inline },
    badge: {
      alignItems: "center",
      backgroundColor: C.tint,
      borderRadius: BADGE / 2,
      height: BADGE,
      justifyContent: "center",
      width: BADGE,
    },
    head: { gap: s.spacing.small },
    center: { textAlign: "center" },
    goSlot: { alignItems: "center", gap: s.spacing.inline },
    go: {
      alignItems: "center",
      backgroundColor: C.fill,
      borderRadius: GO / 2,
      height: GO,
      justifyContent: "center",
      width: GO,
    },
  });

export default Ready;
