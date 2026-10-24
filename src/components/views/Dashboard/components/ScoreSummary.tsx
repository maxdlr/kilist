import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { FoodInStockScoreThreshold, FoodTypeDisplay } from "@/utils/scoreUtils";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

const ScoreSummary = ({
  summary,
  style,
}: {
  summary: {
    level: FoodInStockScoreThreshold;
    color: FoodTypeDisplay["color"];
    name: string;
    count: number;
  };
  style?: StyleProp<ViewStyle>;
}) => {
  const theme = useTheme();

  return (
    <ThemedView
      key={summary.level}
      style={{
        ...styles.container,
        backgroundColor: summary.color[50],
        borderColor: theme.text,
        ...(style || {}),
      }}
    >
      {/* <ThemedText>{summary.name}</ThemedText> */}
      <ThemedText
        type="subtitle"
        style={{ ...styles.text, color: summary.color[80] }}
      >
        {summary.count}
      </ThemedText>
    </ThemedView>
  );
};
const styles = StyleSheet.create({
  container: {
    // flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    height: 60,
    borderRadius: Spacing.three,
  },
  text: {},
});
export default ScoreSummary;
