import KilButton from "@/components/elements/KilButton";
import { DashboardType } from "./interfaces";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import {
  FoodInStockScoreThreshold,
  inStockScoreToDisplay,
} from "@/utils/scoreUtils";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet } from "react-native";
import { Spacing } from "@/constants/theme";
import ScoreSummary from "./components/ScoreSummary";
import { ShoppingCartIcon } from "react-native-heroicons/solid";
import { transparentColor } from "@/utils/colorUtils";

const Dashboard = ({ dashboard }: { dashboard: DashboardType }) => {
  const { foods, shopLists } = dashboard;
  const theme = useTheme();

  const latestFoodSummaries = Object.entries(foods?.scoreSummary)
    .map(([key, value]) => {
      const display = inStockScoreToDisplay(parseFloat(key), theme);

      return {
        level: Number(key) as FoodInStockScoreThreshold,
        color: display.color,
        name: display.label,
        count: value,
      };
    })
    .sort((a, b) => b.level - a.level)
    .reverse();

  return (
    <ThemedView>
      <ThemedView
        style={{ ...styles.section, backgroundColor: theme.background }}
      >
        <ThemedText type="title" style={{ color: theme.foods[1][80] }}>
          Status
        </ThemedText>
        <ThemedView style={styles.scoresContainer}>
          {latestFoodSummaries?.map((summary) => (
            <ScoreSummary
              style={{
                marginBottom: Spacing.three,
              }}
              key={summary.level}
              summary={summary}
            />
          ))}
        </ThemedView>
      </ThemedView>
      <ThemedView
        style={{
          ...styles.section,
          backgroundColor: theme.background,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <KilButton
          href="/shop"
          style={{
            container: {
              ...styles.startShopListButtonContainer,
              backgroundColor: theme.foods[1][40],
              borderColor: theme.foods[1][70],
            },
            label: styles.startShopListButtonText,
          }}
          Icon={
            <ShoppingCartIcon
              size={100}
              color={theme.foods[1][80]}
              style={{}}
            />
          }
        />
      </ThemedView>

      <ThemedView
        style={{ ...styles.section, backgroundColor: theme.background }}
      >
        <ThemedText type="title">En ce moment</ThemedText>
        {[
          {
            title: "Articles",
            content: foods.total,
          },
          {
            title: "Shop sessions",
            content: shopLists.total,
          },
        ].map((item) => (
          <ThemedView
            key={item.title}
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: Spacing.five,
            }}
          >
            <ThemedText type="subtitle">{item.title}</ThemedText>
            <ThemedText>{item.content}</ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  scoresContainer: {
    display: "flex",
    flexDirection: "row",
    gap: Spacing.three,
    justifyContent: "center",
    overflow: "hidden",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: Spacing.three,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    borderRadius: Spacing.five,
  },
  startShopListButtonContainer: {
    aspectRatio: 1,
    width: 180,
    borderRadius: 100,
    borderWidth: Spacing.one,
    paddingVertical: 0,
    paddingTop: Spacing.five,
  },
  startShopListButtonText: {},
});

export default Dashboard;
