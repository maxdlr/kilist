import { Spacing, ThemeColor } from "@/constants/theme";
import { Theme, useTheme } from "expo-router";
import { StyleSheet } from "react-native";

const useGroceryListStyles = () => {
  const theme = useTheme();
  const style = StyleSheet.create({
    scrollView: {
      // backgroundColor: theme.colors.background,
    },
    contentContainer: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: Spacing.one,
    },
    title: {
      paddingBottom: Spacing.four,
    },
    row: {
      backgroundColor: theme.colors.background,
      paddingVertical: Spacing.three,
      paddingHorizontal: Spacing.four,
      borderRadius: Spacing.four,
    },
    rowTitle: {
      fontWeight: "bold",
      fontSize: 24,
      // color: "red",
    },
    item: {
      color: "gray",
    },
  });
  return style;
};

export default useGroceryListStyles;
