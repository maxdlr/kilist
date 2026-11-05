import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  FoodInStockScoreThreshold,
  inStockScoreToDisplay,
} from "@/utils/scoreUtils";
import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { ShoppingCartIcon } from "react-native-heroicons/solid";
import ScoreSummary from "./components/ScoreSummary";
import { DashboardType } from "./interfaces";

const Dashboard = ({
  dashboard,
  onRefresh,
}: {
  dashboard: DashboardType;
  onRefresh: () => unknown;
}) => {
  const { foods, shopLists, swipes } = dashboard;
  const theme = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const summaries = Object.entries(foods.scoreSummary)
    .map(([key, count]) => {
      const display = inStockScoreToDisplay(parseFloat(key), theme);

      return {
        level: Number(key) as FoodInStockScoreThreshold,
        color: display.color,
        name: display.label,
        count,
      };
    })
    .sort((a, b) => a.level - b.level);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} />
      }
    >
      <View style={styles.summaries}>
        {summaries.map((summary) => (
          <ScoreSummary key={summary.level} summary={summary} />
        ))}
      </View>

      <Pressable
        onPress={() => router.push("/shop")}
        accessibilityRole="button"
        accessibilityLabel="Start shopping"
        style={[
          styles.shopButton,
          {
            backgroundColor: theme.foods[1][40],
            borderColor: theme.foods[1][70],
          },
        ]}
      >
        <ShoppingCartIcon size={72} color={theme.foods[1][80]} />
        <ThemedText type="smallBold" style={{ color: theme.foods[1][90] }}>
          Start shopping
        </ThemedText>
      </Pressable>

      <View style={styles.totals}>
        <View style={styles.total}>
          <ThemedText type="subtitle">{foods.total}</ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.totalLabel}
          >
            Food items
          </ThemedText>
        </View>
        <View style={styles.total}>
          <ThemedText type="subtitle">{shopLists.total}</ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.totalLabel}
          >
            Shopping sessions
          </ThemedText>
        </View>
        <View style={styles.total}>
          <ThemedText type="subtitle">{swipes.total}</ThemedText>
          <ThemedText
            type="small"
            themeColor="textSecondary"
            style={styles.totalLabel}
          >
            Swipe sessions
          </ThemedText>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "space-evenly",
    gap: Spacing.five,
    paddingHorizontal: Spacing.two,
  },
  summaries: {
    flexDirection: "row",
    gap: Spacing.two,
    width: "100%",
  },
  shopButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
    width: 180,
    aspectRatio: 1,
    borderRadius: 90,
    borderWidth: Spacing.one,
  },
  totals: {
    flexDirection: "row",
    width: "100%",
  },
  total: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.half,
  },
  totalLabel: {
    textAlign: "center",
  },
});

export default Dashboard;
