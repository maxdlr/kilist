import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { calmPalette as C } from "..";
import { CButton, CText, Screen } from "./parts";

const BAR = 120;
const SLIDER = 40;
const SWEEP_MS = 900;

export const CalmLoading = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const shift = useSharedValue(0);

  useEffect(() => {
    shift.set(withRepeat(withTiming(BAR - SLIDER, { duration: SWEEP_MS }), -1, true));
  }, [shift]);

  const slider = useAnimatedStyle(() => ({ transform: [{ translateX: shift.value }] }));

  return (
    <Screen>
      <View accessibilityRole="progressbar" accessibilityLabel="Loading" style={styles.center}>
        <View style={styles.track}>
          <Animated.View style={[styles.slider, slider]} />
        </View>
        <CText size={skin.type.label} color={C.soft}>Loading</CText>
      </View>
    </Screen>
  );
};

export const CalmError = ({ onRetry }: { onRetry: () => unknown }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [busy, setBusy] = useState(false);

  const retry = async () => {
    setBusy(true);
    try {
      await onRetry();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen dock={<CButton label={busy ? "Trying…" : "Try again"} onPress={retry} />}>
      <View style={styles.middle}>
        <CText weight="medium" size={skin.type.headline}>{"Couldn't connect."}</CText>
        <CText size={skin.type.body} color={C.soft}>Check your connection and try again. Nothing was lost.</CText>
      </View>
    </Screen>
  );
};

export const CalmMessage = ({
  title,
  line,
  dock,
}: {
  title: string;
  line: string;
  dock?: React.ReactNode;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  return (
    <Screen dock={dock}>
      <View style={styles.middle}>
        <CText weight="medium" size={skin.type.display.md} accessibilityRole="header">{title}</CText>
        <CText size={skin.type.body} color={C.soft}>{line}</CText>
      </View>
    </Screen>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    center: { alignItems: "center", flex: 1, gap: s.spacing.stack, justifyContent: "center" },
    track: { backgroundColor: C.hairline, height: 2, overflow: "hidden", width: BAR },
    slider: { backgroundColor: C.ink, height: "100%", width: SLIDER },
    middle: { flex: 1, gap: s.spacing.small, justifyContent: "center" },
  });
