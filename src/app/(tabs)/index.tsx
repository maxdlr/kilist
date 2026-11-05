import EmptyData from "@/components/elements/EmptyData";
import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import { ThemedView } from "@/components/themed-view";
import Dashboard from "@/components/views/Dashboard/Dashboard";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";
import useSWR from "swr";

const ListsScreen = () => {
  const { data, isLoading, mutate } = useSWR({ url: "/dashboard" });

  return (
    <ThemedView style={styles.container}>
      {data ? (
        <Dashboard dashboard={data} />
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
