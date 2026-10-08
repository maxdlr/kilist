import { ThemedText } from "@/components/themed-text";
import { StyleSheet } from "react-native";

const Pill = ({ label, color }: { label: string; color?: string }) => {
  return (
    <ThemedText
      type="small"
      style={{
        ...styles.label,
        backgroundColor: color ?? "#E0E0E0",
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
    backgroundColor: "#E0E0E0",
  },
});

export default Pill;
