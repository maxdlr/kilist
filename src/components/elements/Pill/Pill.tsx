import { ThemedText } from "@/components/themed-text";
import { FoodTypeDisplay } from "@/utils/scoreUtils";
import { StyleProp, StyleSheet, TextStyle } from "react-native";

const Pill = ({
  label,
  color,
  style,
  display,
}: {
  label?: string;
  color?: string;
  style?: StyleProp<TextStyle>;
  display?: FoodTypeDisplay;
}) => {
  return (
    <ThemedText
      type="small"
      style={{
        ...styles.label,
        backgroundColor: display?.color[20] ?? color ?? "transparent",
        color: display?.color[80] ?? color ?? "transparent",
        ...style,
      }}
    >
      {display?.label ?? label}
    </ThemedText>
  );
};

const styles = StyleSheet.create({
  label: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    // backgroundColor: "#E0E0E0",
  },
});

export default Pill;
