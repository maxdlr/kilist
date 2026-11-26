import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import AnimationService from "@/services/animation";
import type { Skin } from "@/skins/types";
import type { ReactNode } from "react";
import { type LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { calmColors, useCalmColors } from "@/skins/calm/theme/useCalmColors";
import { CText } from "@/skins/calm/components";

const TINT = {
  transitionDuration: AnimationService.feedback.tint.duration,
  transitionProperty: ["backgroundColor", "borderColor", "height"] as string[],
  transitionTimingFunction: "ease-out",
};

const AisleGroup = ({
  label,
  count,
  progress,
  focused,
  started,
  targeted,
  dimmed = false,
  action,
  kind = "aisle",
  onLayout,
  children,
}: {
  label: string;
  count: string;
  progress: number;
  focused: boolean;
  started: boolean;
  targeted: boolean;
  dimmed?: boolean;
  action?: ReactNode;
  kind?: "aisle" | "next";
  onLayout?: (event: LayoutChangeEvent) => void;
  children: ReactNode;
}) => {
  const skin = useSkin();
  const L = useCalmColors().shopList.aisle;
  const styles = useSkinStyles(createStyles);
  const ink = targeted ? L.title.targeted : kind === "next" ? L.title.next : focused ? L.title.focused : L.title.idle;

  return (
    <Animated.View
      onLayout={onLayout}
      entering={FadeIn.duration(AnimationService.enter.duration)}
      exiting={FadeOut.duration(AnimationService.exit.duration)}
      layout={LinearTransition.duration(AnimationService.reflow)}
      style={[dimmed && styles.dimmed, FADE]}
    >
      <View style={styles.label} accessibilityRole="header">
        {kind === "aisle" && (
          <View style={[styles.corner, { borderColor: started ? L.corner.started : focused ? L.corner.focused : L.corner.idle }, TINT]} />
        )}
        <CText size={skin.type.caption} weight={targeted ? "semibold" : "medium"} color={ink} numberOfLines={1}>
          {label}
        </CText>
        <View style={[styles.dot, { backgroundColor: ink }]} />
        <CText size={skin.type.caption} weight="medium" color={ink} numberOfLines={1} style={styles.count}>
          {count}
        </CText>
        {action && <View style={styles.action}>{action}</View>}
      </View>
      <View style={[styles.rows, kind === "next" && styles.nextRows]}>
        {kind === "aisle" ? (
          <View style={[styles.spine, { backgroundColor: focused ? L.track.focused : L.track.idle }, TINT]}>
            <View style={[styles.fill, { height: `${Math.round(progress * 100)}%` }, TINT]} />
          </View>
        ) : (
          <View style={[styles.bar, { backgroundColor: L.nextBar }]} />
        )}
        {children}
      </View>
    </Animated.View>
  );
};

const LINE = 3;

const FADE = {
  transitionDuration: AnimationService.enter.duration,
  transitionProperty: ["opacity"] as string[],
  transitionTimingFunction: "ease-out",
};

const createStyles = (s: Skin, L = calmColors(s).shopList.aisle) =>
  StyleSheet.create({
    label: {
      alignItems: "center",
      flexDirection: "row",
      gap: s.spacing.small,
      paddingBottom: s.spacing.small,
      paddingStart: s.spacing.stack + s.spacing.tight,
    },
    corner: {
      borderLeftWidth: LINE,
      borderTopLeftRadius: s.spacing.small + 2,
      borderTopWidth: LINE,
      bottom: 0,
      height: s.spacing.stack - 3,
      left: 0,
      position: "absolute",
      width: s.spacing.small + 3,
    },
    dot: { borderRadius: 3, height: 5, opacity: 0.9, width: 5 },
    count: { flexShrink: 0 },
    action: { flex: 1, alignItems: "flex-end" },
    dimmed: { opacity: L.dimmedOpacity },
    rows: { paddingStart: s.spacing.stack - 2 },
    nextRows: { paddingStart: LINE },
    spine: {
      borderBottomLeftRadius: 2,
      borderBottomRightRadius: 2,
      bottom: s.spacing.small,
      left: 0,
      overflow: "hidden",
      position: "absolute",
      top: 0,
      width: LINE,
    },
    fill: { backgroundColor: L.progress, left: 0, position: "absolute", right: 0, top: 0 },
    bar: {
      borderRadius: 2,
      bottom: s.spacing.small,
      left: 0,
      position: "absolute",
      top: s.spacing.small,
      width: LINE,
    },
  });

export default AisleGroup;
