import { ThemedText } from "@/components/themed-text";
import { StyleProp, StyleSheet, TextStyle } from "react-native";

const Pill = ({
  label,
  color,
  style,
}: {
  label: string;
  color?: string;
  style?: StyleProp<TextStyle>;
}) => {
  return (
    <ThemedText
      type="small"
      style={{
        ...styles.label,
        backgroundColor: color ?? "transparent",
        ...style,
      }}
    >
      {label}
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
