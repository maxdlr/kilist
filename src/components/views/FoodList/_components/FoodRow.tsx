import Pill from "@/components/elements/Pill";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { FoodType } from "@/types/model";
import { transparentColor } from "@/utils/colorUtils";
import { inStockScoreToDisplay } from "@/utils/scoreUtils";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";

const FoodRow = ({
  food,
  style,
}: {
  food: FoodType;
  style?: StyleProp<ViewStyle>;
}) => {
  const { name, inStockScore } = food;
  const theme = useTheme();
  const display = inStockScoreToDisplay(inStockScore, theme);

  return (
    <ThemedView
      style={{
        ...styles.item,

        backgroundColor: display.color[500],

        height: 70,

        borderBottomColor: display.color[500],

        ...style,
      }}
    >
      <ThemedText
        type="default"
        style={{
          ...styles.name,
        }}
      >
        {name}
      </ThemedText>

      <Pill label={display.label} color={display.color[500]} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  item: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.four,
    borderBottomWidth: 2,
  },

  name: {
    // fontSize: 26,
    fontWeight: "bold",
  },
});

export default FoodRow;
