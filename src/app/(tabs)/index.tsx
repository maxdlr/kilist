import EmptyData from "@/components/elements/EmptyData";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import { ThemedView } from "@/components/themed-view";
import Dashboard from "@/components/views/Dashboard/Dashboard";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { StyleSheet } from "react-native";
import useSWR from "swr";

const ListsScreen = () => {
  const theme = useTheme();
  const { data, isLoading, mutate } = useSWR({ url: "/dashboard" });

  useFocusEffect(
    useCallback(() => {
      mutate();
    }, [mutate]),
  );

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {data ? (
        <Dashboard dashboard={data} onRefresh={mutate} />
      ) : isLoading ? (
        <LoadingAnim centered />
      ) : (
        <EmptyData label="Couldn't load your dashboard" onRefresh={mutate} />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.two,
  },
});

export default ListsScreen;
