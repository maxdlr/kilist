import Dock from "@/components/elements/Dock/Dock";
import Press from "@/components/elements/Press";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import { ThemedText } from "@/components/themed-text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import useAuth from "@/providers/AuthProvider";
import { router } from "expo-router";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import type { Skin } from "@/skins/types";
import AnimationService from "@/services/animation";
import { type ReactNode, useEffect, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { XmarkIcon } from "@/components/icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Dot = ({
  index,
  progress,
}: {
  index: number;
  progress: SharedValue<number>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const dotStyle = useAnimatedStyle(() => {
    const near = interpolate(
      Math.abs(progress.value - index),
      [0, 1],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return {
      opacity: 0.3 + 0.7 * near,
      width:
        skin.spacing.small + (skin.spacing.section - skin.spacing.small) * near,
    };
  });
  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: skin.colors.onGround }, dotStyle]}
    />
  );
};

const Intro = ({
  onDone,
  onExit,
  art = {},
}: {
  onDone: () => void;
  onExit?: () => void;
  art?: Record<number, ReactNode>;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.intro;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const progress = useSharedValue(0);
  const [step, setStep] = useState(0);
  const last = copy.steps.length - 1;
  const { ground: fill, onGround: ink } = skin.colors;
  const onLast = useSharedValue(0);
  const { isGuest } = useAuth();

  useEffect(() => {
    onLast.set(withTiming(step < last ? 0 : 1, AnimationService.config));
  }, [step, last, onLast]);

  const skipStyle = useAnimatedStyle(() => ({ opacity: 1 - onLast.value }));
  const startStyle = useAnimatedStyle(() => ({
    height: skin.size.button.lg * onLast.value,
    marginTop: -skin.spacing.inline * (1 - onLast.value),
    opacity: onLast.value,
    transform: [{ translateY: skin.spacing.stack * (1 - onLast.value) }],
  }));

  const onPagerScroll = useAnimatedScrollHandler((event) => {
    progress.set(event.contentOffset.x / width);
  });

  useStatusBarStyle(
    skin.statusBarOnGround,
  );

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== step) setStep(Math.max(0, Math.min(last, next)));
  };

  return (
    <View style={[styles.flex, { backgroundColor: skin.colors.ground }]}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onPagerScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScroll}
        style={styles.flex}
      >
        {copy.steps.map((item, index) => {
          return (
            <View
              key={item.title}
              accessible
              accessibilityLabel={`Step ${index + 1} of ${copy.steps.length}. ${item.title} ${item.line}`}
              style={[
                styles.page,
                {
                  backgroundColor: fill,
                  paddingTop: insets.top + skin.spacing.top,
                  width,
                },
              ]}
            >
              <View style={styles.topLine} />
              <View style={styles.body}>
                {art[index]}
                <Title size={skin.type.display.lg} lines={4} color={ink}>
                  {item.title}
                </Title>
                {!art[index] && (
                  <ThemedText size={skin.type.lead} color={ink}>
                    {item.line}
                  </ThemedText>
                )}
              </View>
            </View>
          );
        })}
      </Animated.ScrollView>

      <View style={[styles.skip, { top: insets.top + skin.spacing.top }]} pointerEvents="box-none">
        <Animated.View
          style={skipStyle}
          pointerEvents={step < last ? "auto" : "none"}
          accessibilityElementsHidden={step >= last}
          importantForAccessibility={step < last ? "auto" : "no-hide-descendants"}
        >
          <KilButton
            variant="ghost"
            height={skin.size.button.xs}
            fontSize={skin.type.label}
            label={copy.skip}
            onTouch={onDone}
          />
        </Animated.View>
        {onExit && (
          <Press
            accessibilityRole="button"
            accessibilityLabel={skin.copy.common.close}
            hitSlop={skin.spacing.small}
            onPress={onExit}
            style={styles.exit}
          >
            <XmarkIcon size={skin.size.icon.action} color={skin.colors.muted} strokeWidth={1.8} />
          </Press>
        )}
      </View>

      <Dock>
        <View
          style={styles.dots}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {copy.steps.map((item, index) => (
            <Dot key={item.title} index={index} progress={progress} />
          ))}
        </View>
        <Animated.View
          style={[styles.start, startStyle]}
          pointerEvents={step >= last ? "auto" : "none"}
          accessibilityElementsHidden={step < last}
          importantForAccessibility={step >= last ? "auto" : "no-hide-descendants"}
        >
          <KilButton
            height={skin.size.button.lg}
            label={copy.start}
            onTouch={onDone}
          />
        </Animated.View>
        {isGuest && (
          <KilButton
            variant="ghost"
            height={skin.size.button.xs}
            fontSize={skin.type.label}
            label={skin.copy.guest.login}
            onTouch={() => router.push("/login")}
          />
        )}
      </Dock>
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    flex: { flex: 1 },
    page: {
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    body: { flex: 1, gap: s.spacing.inline, justifyContent: "center" },
    topLine: { height: s.size.button.xs, justifyContent: "center" },
    start: { overflow: "hidden" },
    skip: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
      position: "absolute",
      right: s.spacing.gutter,
    },
    exit: { justifyContent: "center", minHeight: s.size.button.xs },
    dots: {
      alignSelf: "center",
      flexDirection: "row",
      gap: s.spacing.small - 2,
      paddingBottom: s.spacing.small,
    },
    dot: { borderRadius: s.spacing.tight, height: s.spacing.small },
  });

export default Intro;
