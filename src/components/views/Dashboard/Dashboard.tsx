import SyncNote from "@/components/elements/SyncNote";
import type { Skin } from "@/skins/types";
import KilButton from "@/components/elements/KilButton";
import Title from "@/components/elements/Title/Title";
import PullToRefresh from "@/components/gestures/PullToRefresh/PullToRefresh";
import { ThemedText } from "@/components/themed-text";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin, useSkinStyles } from "@/providers/SkinProvider";
import { levelOf, THRESHOLDS } from "@/utils/scoreUtils";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DashboardType } from "./interfaces";

export const stripeHeights = (
  counts: number[],
  available: number,
  minStripe: number,
) => {
  const floor = Math.min(minStripe, available / counts.length);
  const extra = Math.max(0, available - floor * counts.length);
  const total = counts.reduce((sum, count) => sum + count, 0);

  return counts.map(
    (count) =>
      floor + (total ? (extra * count) / total : extra / counts.length),
  );
};

const Dashboard = ({
  dashboard,
  onRefresh,
}: {
  dashboard: DashboardType;
  onRefresh: () => unknown;
}) => {
  const skin = useSkin();
  const styles = useSkinStyles(createStyles);
  const copy = skin.copy.home;
  const insets = useSafeAreaInsets();
  const [available, setAvailable] = useState(0);
  useStatusBarStyle(skin.statusBarOnGround);

  const { foods, shopLists, swipes } = dashboard;
  const needed = foods.scoreSummary[0] + foods.scoreSummary[0.25];
  const counts = THRESHOLDS.map((threshold) => foods.scoreSummary[threshold]);
  const heights = stripeHeights(counts, available, skin.size.row.stripe);

  return (
    <PullToRefresh onRefresh={onRefresh}>
      <View style={[styles.root, { backgroundColor: skin.colors.ground }]}>
        <View style={[styles.header, { paddingTop: insets.top + skin.spacing.top }]}>
          <Title size={skin.type.display.md} lines={2} color={skin.colors.accent}>
            {copy.headline(needed)}
          </Title>
        </View>

        <View
          style={styles.levels}
          onLayout={(event) => setAvailable(event.nativeEvent.layout.height)}
        >
          {available > 0 &&
            THRESHOLDS.map((threshold, index) => {
              const level = levelOf(threshold);
              const label = skin.copy.levels[level];
              const count = counts[index]!;

              return (
                <View
                  key={threshold}
                  accessible
                  accessibilityLabel={`${label}: ${count}`}
                  style={[
                    styles.level,
                    {
                      backgroundColor: skin.colors.levels[level],
                      height: heights[index],
                    },
                  ]}
                >
                  <ThemedText size={skin.type.lead} color={skin.colors.onLevel}>
                    {label}
                  </ThemedText>
                  <ThemedText size={skin.type.headline} color={skin.colors.onLevel}>
                    {String(count)}
                  </ThemedText>
                </View>
              );
            })}
        </View>

        <KilButton
          height={skin.size.button.xl}
          fontSize={skin.type.headline}
          style={styles.cta}
          {...(needed
            ? { label: copy.shop, href: "/shop" as const }
            : { label: copy.swipe, href: "/swipe" as const })}
        />
        <ThemedText size={skin.type.label} color={skin.colors.onGround} style={styles.tally}>
          {copy.tally(foods.total, shopLists.total, swipes.total)}
        </ThemedText>
        <SyncNote color={skin.colors.onGround} />
      </View>
    </PullToRefresh>
  );
};

const createStyles = (s: Skin) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    header: {
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
    },
    levels: {
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
    },
    level: {
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "space-between",
      overflow: "hidden",
      paddingHorizontal: s.spacing.gutter,
    },
    cta: {
      marginBottom: s.spacing.inline,
      marginHorizontal: s.spacing.dock,
      marginTop: s.spacing.inline,
    },
    tally: {
      paddingBottom: s.spacing.section,
      paddingHorizontal: s.spacing.gutter,
      textAlign: "center",
    },
  });

export default Dashboard;
