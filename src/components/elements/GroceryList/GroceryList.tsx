"use client";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { GroceryListType } from "@/types/model";
import { Platform, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useSWR from "swr";

const GroceryList = () => {
  const { data: lists } = useSWR<GroceryListType[]>({ url: "lists/browse" });
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
    // style={[style.scrollView, { backgroundColor: theme.background }]}
    // contentInset={insets}
    // contentContainerStyle={[style.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={style.contentContainer}>
        {lists?.map(({ id, title, description, items }) => (
          <ThemedView key={id} style={style.listItem}>
            <ThemedText style={style.title} type="title">
              {title}
            </ThemedText>
            {/* <ThemedText type="small">{description}</ThemedText> */}
            {items?.map(({ id: itemId, name }) => (
              <ThemedView key={itemId}>
                <ThemedText style={style.item} type="small">
                  {name}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>
        ))}
      </ThemedView>
    </ScrollView>
  );
};

const style = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: Spacing.one,
  },
  listItem: {
    paddingVertical: Spacing.three,
  },
  title: {
    color: "red",
  },
  item: {
    color: "blue",
  },
});
export default GroceryList;
