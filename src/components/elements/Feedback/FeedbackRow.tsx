import KilButton from "@/components/elements/KilButton";
import { ThemedText } from "@/components/elements/ThemedText";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import { type ReactNode, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import Presence from "./Presence";

const FeedbackRow = ({
  error,
  retryLabel,
  onRetry,
  children,
}: {
  error?: string | null;
  retryLabel?: string;
  onRetry?: () => void;
  children: ReactNode;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const row = skin.feedback.row;
  const tint = useSharedValue(error ? 1 : 0);

  useEffect(() => {
    tint.set(withTiming(error ? 1 : 0, AnimationService.feedback.tint));
  }, [error, tint]);

  const fill = useAnimatedStyle(() => ({ opacity: tint.value }));
  const edge = useAnimatedStyle(() => ({ transform: [{ scaleY: tint.value }], opacity: tint.value }));

  return (
    <View style={styles.wrap}>
      {children}
      <Presence visible={Boolean(error)}>
        <View accessibilityRole="alert" style={styles.message}>
          <ThemedText size={skin.type.caption} color={row.message} style={styles.flex}>
            {error}
          </ThemedText>
          {onRetry && retryLabel && <KilButton small variant="secondary" label={retryLabel} onTouch={onRetry} />}
        </View>
      </Presence>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: row.fill, borderRadius: skin.shape.radius }, fill]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.edge, { backgroundColor: row.edge, width: row.edgeWidth }, edge]}
      />
    </View>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    wrap: { overflow: "hidden" },
    edge: { bottom: 0, left: 0, position: "absolute", top: 0 },
    message: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.inline,
      paddingBottom: s.spacing.small,
      paddingHorizontal: s.spacing.inline,
    },
    flex: { flex: 1, minWidth: 0 },
  });

export default FeedbackRow;
