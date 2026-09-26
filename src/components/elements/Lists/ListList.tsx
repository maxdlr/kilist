"use client";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { ListType } from "@/types/model";
import { Platform, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import useSWR from "swr";
import useGroceryListStyles from "./style";
import ListRow from "./_components/ListRow";
import { useEffect } from "react";
import { useRouter } from "expo-router";

const List = () => {
  const { data: lists } = useSWR<ListType[]>({ url: "lists/browse" });
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const style = useGroceryListStyles();
  const router = useRouter();
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

  useEffect(() => {
    if (lists?.length === 1) {
      router.navigate(`/${lists[0].id}`);
    }
  });

  return (
    <ScrollView
      style={[style.scrollView]}
      contentInset={insets}
      contentContainerStyle={[style.contentContainer, contentPlatformStyle]}
    >
      <ThemedText type="title" style={style.title}>
        Mes listes
      </ThemedText>
      <ThemedView style={style.contentContainer}>
        {lists?.map((row) => (
          <ListRow key={row.id} row={row} />
        ))}
      </ThemedView>
    </ScrollView>
  );
};

export default List;
