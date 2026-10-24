import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Dashboard from "@/components/views/Dashboard/Dashboard";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { StyleSheet } from "react-native";
import useSWR from "swr";

const ListsScreen = () => {
  const { data } = useSWR({ url: "/dashboard" });

  return (
    <ThemedView style={styles.container}>
      {!data ? (
        <ThemedText>loading</ThemedText>
      ) : (
        <Dashboard dashboard={data} />
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
