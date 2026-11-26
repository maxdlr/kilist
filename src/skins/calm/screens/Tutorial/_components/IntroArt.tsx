import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import T from "@/skins/calm/text";
import { CText } from "@/skins/calm/components/CText";
import { CartIcon, CheckIcon } from "@/components/icons";
import { SwipeUnder } from "@/skins/calm/screens/Shop/_components/ShopRow";

const SORT_LOOP_MS = 7200;
const SHOP_LOOP_MS = 5200;
const CARD_PUSH = 64;
const CARD_LIFT = 48;
const ROW_PUSH = 190;
const FINGER = 36;
const PAD = 26;
const SORT_RAISE = 24;

const SORT_AT = [0, 0.06, 0.16, 0.26, 0.33, 0.39, 0.49, 0.59, 0.66, 0.72, 0.82, 0.92, 1];
const SORT_X = [0, 0, 1, 1, 0, 0, -1, -1, 0, 0, 0, 0, 0];
const SORT_Y = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, -1, 0];

const SHOP_AT = [0, 0.08, 0.22, 0.38, 0.5, 0.58, 0.72, 0.88, 1];
const SHOP_X = [0, 0, 1, 1, 0, 0, -1, -1, 0];

const useKeyframes = (duration: number, at: number[], values: number[]) => {
  const reduced = useReducedMotion();
  const value = useSharedValue(values[0] ?? 0);

  useEffect(() => {
    if (reduced) return;
    const steps = values
      .slice(1)
      .map((target, index) =>
        withTiming(target, { duration: (at[index + 1]! - at[index]!) * duration, easing: AnimationService.config.easing }),
      );
    value.set(withRepeat(withSequence(...steps), -1));
  }, [reduced, duration, at, values, value]);

  return value;
};

export const SortArt = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const stamps = T.tutorial.stamps;
  const [behind, front] = T.tutorial.samples;
  const x = useKeyframes(SORT_LOOP_MS, SORT_AT, SORT_X);
  const y = useKeyframes(SORT_LOOP_MS, SORT_AT, SORT_Y);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value * CARD_PUSH },
      { translateY: y.value * CARD_LIFT },
      { rotateZ: `${x.value * 8}deg` },
    ],
  }));
  const rightStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, x.value) }));
  const leftStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, -x.value) }));
  const upStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, -y.value) }));
  const ink = C.gameCard.title;
  const onInk = C.gameCard.front.fill;
  const pad = (direction: "left" | "right", lit: typeof leftStyle) => {
    const icon = (ink: string) =>
      direction === "left" ? (
        <CartIcon size={PAD * 0.55} color={ink} strokeWidth={1.8} />
      ) : (
        <CheckIcon size={PAD * 0.55} color={ink} strokeWidth={2.2} />
      );
    return (
      <View style={[styles.pad, { backgroundColor: "transparent", borderColor: ink }]}>
        {icon(ink)}
        <Animated.View
          style={[styles.pad, styles.padLit, { backgroundColor: ink, borderColor: ink }, lit]}
        >
          {icon(onInk)}
        </Animated.View>
      </View>
    );
  };

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.art, styles.sortArt]}>
      <View style={styles.stage}>
        <View style={[styles.card, styles.cardBehind]}>
          <CText weight="medium" size={skin.type.title} color={C.gameCard.title} style={styles.behindName}>
            {behind}
          </CText>
        </View>
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.stamp}>
            <Animated.View style={[styles.stampLabel, rightStyle]}>
              <CText weight="semibold" size={skin.type.label} color={ink}>
                {stamps.right}
              </CText>
            </Animated.View>
            <Animated.View style={[styles.stampLabel, leftStyle]}>
              <CText weight="semibold" size={skin.type.label} color={ink}>
                {stamps.left}
              </CText>
            </Animated.View>
            <Animated.View style={[styles.stampLabel, upStyle]}>
              <CText weight="semibold" size={skin.type.label} color={C.gameCard.question}>
                {stamps.up}
              </CText>
            </Animated.View>
          </View>
          <CText weight="medium" size={skin.type.title} color={C.gameCard.title}>
            {front}
          </CText>
          <CText size={skin.type.caption} color={C.gameCard.question}>
            {T.play.question}
          </CText>
          <View style={styles.pads}>
            {pad("left", leftStyle)}
            {pad("right", rightStyle)}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

export const ShopArt = () => {
  const skin = useSkin();
  const C = useCalmColors();
  const styles = useSkinStyles(createStyles);
  const name = T.tutorial.samples[1];
  const x = useKeyframes(SHOP_LOOP_MS, SHOP_AT, SHOP_X);

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * ROW_PUSH }] }));
  const drag = useDerivedValue(() => x.value * ROW_PUSH);
  const fingerStyle = useAnimatedStyle(() => ({ opacity: Math.abs(x.value) * 0.25 }));

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.art}>
      <View style={styles.slot}>
        <SwipeUnder drag={drag} side={1} armed={C.shopList.row.swipe.buy} />
        <SwipeUnder drag={drag} side={-1} armed={C.shopList.row.swipe.later} />
        <Animated.View style={[styles.row, rowStyle]}>
          <CText weight="medium" size={skin.type.body}>
            {name}
          </CText>
          <View pointerEvents="none" style={styles.rowFinger}>
            <Animated.View style={[styles.finger, styles.fingerCentered, fingerStyle]} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const createStyles = (s: Skin, C = calmColors(s)) =>
  StyleSheet.create({
    art: { alignItems: "center", alignSelf: "stretch", paddingBottom: s.spacing.section },
    sortArt: { marginTop: -SORT_RAISE * 2 },
    stage: { alignItems: "center", height: 230, justifyContent: "center", width: 240 },
    card: {
      alignItems: "center",
      backgroundColor: C.gameCard.front.fill,
      borderColor: C.gameCard.front.border,
      borderRadius: s.shape.radius + 6,
      borderWidth: C.gameCard.border.width,
      gap: s.spacing.tight,
      height: 190,
      justifyContent: "center",
      position: "absolute",
      width: 140,
    },
    cardBehind: {
      backgroundColor: C.gameCard.behind.fill,
      borderColor: C.gameCard.behind.border,
      transform: [{ translateY: 10 }, { scale: 0.94 }],
    },
    behindName: { opacity: C.gameCard.behind.contentOpacity },
    pads: { bottom: s.spacing.stack, flexDirection: "row", gap: s.spacing.small, position: "absolute" },
    pad: {
      alignItems: "center",
      borderRadius: PAD / 2,
      borderWidth: s.shape.border,
      height: PAD,
      justifyContent: "center",
      width: PAD,
    },
    padLit: { left: -s.shape.border, position: "absolute", top: -s.shape.border },
    stamp: { height: s.spacing.section, left: 0, position: "absolute", right: 0, top: s.spacing.inline },
    stampLabel: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
    finger: {
      borderRadius: FINGER / 2,
      height: FINGER,
      position: "absolute",
      width: FINGER,
    },
    slot: {
      alignSelf: "stretch",
      borderColor: C.introDemo.rowBorder,
      borderRadius: s.shape.radius,
      borderWidth: s.shape.border * 2,
      overflow: "hidden",
    },
    row: {
      alignItems: "center",
      backgroundColor: C.shopList.row.fill,
      flexDirection: "row",
      minHeight: s.size.row.shop,
      paddingHorizontal: s.spacing.stack,
    },
    rowFinger: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
    fingerCentered: { backgroundColor: C.text, position: "relative" },
  });
