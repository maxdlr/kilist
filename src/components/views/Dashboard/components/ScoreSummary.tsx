import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { FoodInStockScoreThreshold, FoodTypeDisplay } from "@/utils/scoreUtils";
import { StyleSheet, View } from "react-native";

const ScoreSummary = ({
  summary,
}: {
  summary: {
    level: FoodInStockScoreThreshold;
    color: FoodTypeDisplay["color"];
    name: string;
    count: number;
  };
}) => {
  return (
    <View style={[styles.container, { backgroundColor: summary.color[50] }]}>
      <ThemedText type="subtitle" style={{ color: summary.color[90] }}>
        {summary.count}
      </ThemedText>
      <ThemedText
        type="small"
        numberOfLines={2}
        style={[styles.label, { color: summary.color[90] }]}
      >
        {summary.name}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.half,
    minHeight: 92,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.half,
    borderRadius: Spacing.three,
  },
  label: {
    textAlign: "center",
  },
});

export default ScoreSummary;
