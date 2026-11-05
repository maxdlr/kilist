import type { Skin } from "@/skins/types";
import Title from "@/components/elements/Title/Title";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import * as SplashScreen from "expo-splash-screen";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Keyframe } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const DURATION = 1400;

export function AnimatedSplashOverlay() {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: { opacity: 1 },
    75: { opacity: 1 },
    100: { opacity: 0 },
  });

  const { top, name, bottom } = skin.copy.splash;
  const style = [styles.splash, { backgroundColor: skin.colors.accent }];
  const content = (
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
  });
