import type { Skin } from "@/skins/types";
import Title from "@/components/elements/Title/Title";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import * as SplashScreen from "expo-splash-screen";
import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Keyframe } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const DURATION = 1400;
const MARK = require("../../assets/images/kilist-mark.png");
const MARK_SIZE = 120;

export function AnimatedSplashOverlay() {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const insets = useSafeAreaInsets();
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: { opacity: 1 },
    75: { opacity: 1 },
    100: { opacity: 0 },
  });

  const { top, name, bottom } = skin.copy.splash;
  const centered = skin.splash === "centered";
  const style = centered
    ? [styles.splash, styles.centered, { backgroundColor: skin.colors.ground }]
    : [styles.splash, { backgroundColor: skin.colors.accent }];
  const content = centered ? (
    <>
      <Image source={MARK} style={styles.mark} accessibilityIgnoresInvertColors />
      <ThemedText size={skin.type.title} color={skin.colors.onGround} style={styles.name}>
        {name}
      </ThemedText>
      <ThemedText
        size={skin.type.body}
        color={skin.colors.muted}
        style={[styles.tagline, { bottom: insets.bottom + skin.spacing.section }]}
      >
        {bottom}
      </ThemedText>
    </>
  ) : (
    <>
      <Title size={skin.type.body} lines={1} header={false}>
        {top}
      </Title>
      <Title size={skin.type.display.xl} lines={1}>
        {name}
      </Title>
      <Title size={skin.type.display.sm} lines={2} header={false}>
        {bottom}
      </Title>
    </>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        "worklet";
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={style}
    >
      {content}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={style}
    >
      {content}
    </View>
  );
}

const createStyles = (s: Skin) =>
  StyleSheet.create({
    splash: {
      bottom: 0,
      justifyContent: "space-between",
      left: 0,
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
      paddingTop: s.spacing.page,
      position: "absolute",
      right: 0,
      top: 0,
      zIndex: 1000,
    },
    centered: { alignItems: "center", justifyContent: "center", paddingBottom: 0, paddingTop: 0 },
    mark: { height: MARK_SIZE, width: MARK_SIZE },
    name: {
      fontFamily: s.fonts.body?.medium ?? s.fonts.display.family,
      left: 0,
      marginTop: MARK_SIZE / 2 + s.spacing.stack,
      position: "absolute",
      right: 0,
      textAlign: "center",
      top: "50%",
    },
    tagline: { left: s.spacing.gutter, position: "absolute", right: s.spacing.gutter, textAlign: "center" },
  });
