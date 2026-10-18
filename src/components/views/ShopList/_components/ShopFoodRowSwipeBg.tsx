import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { StyleSheet } from "react-native";

const ShopFoodRowSwipeBg = ({ buying = true }: { buying?: boolean }) => {
  const theme = useTheme();

  const buyingContent = (
    <ThemedView style={styles.loading}>
      <ThemedText
        style={{
          color: buying ? theme.confirm[90] : theme.cancel[90],
        }}
      >
        Buying
      </ThemedText>
      <LoadingAnim colorScale={theme.confirm} />
    </ThemedView>
  );

  const snoozingContent = (
    <ThemedView
      style={{
        justifyContent: "flex-end",
        ...styles.loading,
      }}
    >
      <LoadingAnim colorScale={theme.cancel} />
      <ThemedText
        style={{
          color: buying ? theme.confirm[90] : theme.cancel[90],
        }}
      >
        Snoozing
      </ThemedText>
    </ThemedView>
  );

  return (
    <ThemedView style={styles.background}>
      <ThemedView
        style={[
          styles.contentContainer,
          { backgroundColor: buying ? theme.confirm[50] : theme.cancel[50] },
        ]}
      >
        {buying ? buyingContent : snoozingContent}
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  background: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
  },

  contentContainer: {
    paddingHorizontal: Spacing.four,
    height: "100%",
    display: "flex",
    justifyContent: "center",
  },

  loading: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});

export default ShopFoodRowSwipeBg;
