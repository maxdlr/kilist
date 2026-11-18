import type { News } from "@/hooks/useNews";
import AnimationService from "@/services/animation";
import { ReactNode, useEffect, useState } from "react";
import { type LayoutChangeEvent, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

export const NewsSlide = ({
  news,
  gap,
  children,
}: {
  news: News | null;
  gap: number;
  children: (news: News) => ReactNode;
}) => {
  const [kept, setKept] = useState<News | null>(news);
  const progress = useSharedValue(0);
  const height = useSharedValue(0);
  const swapping = news !== null && kept !== null && news.id !== kept.id;

  if (news && !kept) setKept(news);

  useEffect(() => {
    const show = news !== null && !swapping;
    progress.set(
      withTiming(show ? 1 : 0, AnimationService.config, (finished) => {
        "worklet";
        if (finished && !show) scheduleOnRN(setKept, news);
      }),
    );
  }, [news, swapping, progress]);

  const outer = useAnimatedStyle(() => ({
    height: height.value * progress.value,
    marginBottom: (progress.value - 1) * gap,
  }));
  const inner = useAnimatedStyle(() => ({
    transform: [{ translateY: (progress.value - 1) * height.value }],
  }));

  if (!kept) return null;

  const measure = (event: LayoutChangeEvent) => height.set(event.nativeEvent.layout.height);

  return (
    <Animated.View style={[styles.clip, outer]}>
      <Animated.View onLayout={measure} style={[styles.content, inner]}>
        {children(kept)}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  clip: { overflow: "hidden" },
  content: { left: 0, position: "absolute", right: 0, top: 0 },
});
