import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { arcadePalette as P } from "..";
import Ground from "./Ground";
import { ArcadeCard, shadowOf } from "./parts";
import { arcadeText as T } from "./text";

const SPIN_MS = 760;

export const ArcadeLoading = () => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const spin = useSharedValue(1);

  useEffect(() => {
    spin.set(
      withRepeat(
        withTiming(-1, { duration: SPIN_MS, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [spin]);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: Math.max(0.12, Math.abs(spin.value)) }],
  }));

  return (
    <Ground style={styles.center}>
      <Animated.View
        style={[styles.coin, { boxShadow: shadowOf(skin, 1) }, coinStyle]}
      >
        <ThemedText size={skin.type.display.md} color={P.navy}>
          K
        </ThemedText>
      </Animated.View>
      <View accessibilityRole="progressbar" accessibilityLabel={T.loading}>
        <Title size={skin.type.title} lines={1} color={P.white} textStyle={styles.centerText}>
          {T.insertingCoin}
        </Title>
      </View>
      <ThemedText size={skin.type.label} color={P.lilac}>
        {T.fetching}
      </ThemedText>
    </Ground>
  );
};

export const ArcadeError = ({ onRetry }: { onRetry: () => unknown }) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Ground
      style={styles.middle}
      dock={
        <KilButton
          height={skin.size.button.lg}
          fontSize={skin.type.lead}
          label={isRetrying ? skin.copy.empty.refreshing : T.anotherCoin}
          onTouch={retry}
        />
      }
    >
      <ArcadeCard fill={P.navy} style={styles.tilt}>
        <View style={styles.tiltSign}>
          <Title size={skin.type.display.lg} lines={1} color={P.coral}>
            {T.tilt}
          </Title>
        </View>
        <ThemedText size={skin.type.body} color={P.white} style={styles.centerText}>
          {T.tiltLine}
        </ThemedText>
        <ThemedText mono size={skin.type.mono - 2} color={P.softNavy} style={styles.centerText}>
          {T.tiltHint}
        </ThemedText>
      </ArcadeCard>
    </Ground>
  );
};

export const OutOfOrder = ({
  sign,
  title,
  line,
  action,
}: {
  sign: string;
  title: string;
  line: string;
  action: { label: string; onTouch: () => void };
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);

  return (
    <Ground
      style={styles.middle}
      dock={
        <KilButton
          height={skin.size.button.lg}
          fontSize={skin.type.lead}
          label={action.label}
          onTouch={action.onTouch}
        />
      }
    >
      <ArcadeCard lift={2} style={styles.board}>
        <View style={styles.hazard}>
          {Array.from({ length: 9 }, (_, index) => (
            <View
              key={index}
              style={[
                styles.hazardStripe,
                { backgroundColor: index % 2 ? P.navy : P.yellow },
              ]}
            />
          ))}
          <View style={styles.hazardSign}>
            <ThemedText size={skin.type.title} color={P.navy}>
              {sign}
            </ThemedText>
          </View>
        </View>
        <ThemedText size={skin.type.body} color={P.navy} style={styles.centerText}>
          {title}
        </ThemedText>
        <ThemedText size={skin.type.label} color={P.navy} style={styles.centerText}>
          {line}
        </ThemedText>
      </ArcadeCard>
    </Ground>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    center: {
      alignItems: "center",
      justifyContent: "center",
    },
    middle: {
      justifyContent: "center",
    },
    centerText: {
      textAlign: "center",
    },
    coin: {
      alignItems: "center",
      backgroundColor: P.yellow,
      borderColor: P.navy,
      borderRadius: s.size.icon.card,
      borderWidth: s.shape.border + 1,
      height: s.size.button.xl + s.spacing.gutter + s.spacing.small,
      justifyContent: "center",
      width: s.size.button.xl + s.spacing.gutter + s.spacing.small,
    },
    tilt: {
      alignItems: "center",
      gap: s.spacing.inline,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.gutter,
    },
    tiltSign: {
      borderColor: P.coral,
      borderRadius: s.shape.radius - s.spacing.tight,
      borderStyle: "dotted",
      borderWidth: s.shape.border + 2,
      paddingHorizontal: s.spacing.section,
      transform: [{ rotateZ: "-4deg" }],
    },
    board: {
      alignItems: "center",
      gap: s.spacing.inline,
      padding: s.spacing.stack,
    },
    hazard: {
      alignItems: "center",
      alignSelf: "stretch",
      borderColor: P.navy,
      borderRadius: s.shape.radius - s.spacing.tight,
      borderWidth: s.shape.border,
      flexDirection: "row",
      height: s.size.icon.card,
      justifyContent: "center",
      overflow: "hidden",
    },
    hazardStripe: {
      flex: 1,
      height: "160%",
      transform: [{ rotateZ: "35deg" }],
    },
    hazardSign: {
      backgroundColor: P.white,
      borderColor: P.navy,
      borderRadius: s.shape.radius - s.spacing.small,
      borderWidth: s.shape.border,
      paddingHorizontal: s.spacing.stack,
      paddingVertical: s.spacing.small,
      position: "absolute",
    },
  });
