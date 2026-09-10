import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { GroceryListType } from "@/types/model";
import { useLocalSearchParams, useTheme } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";
import useSWR from "swr";

const ListDetailsScreen = () => {
  const { id } = useLocalSearchParams();
  const theme = useTheme();

  const { data } = useSWR<GroceryListType>({
    url: "lists/read",
    params: {
      id,
    },
  });

  return (
    <ScrollView
      style={
        (styles.listContainer, { backgroundColor: theme.colors.background })
      }
    >
      {data?.items.map(({ id, name }) => (
        <ThemedView key={id} style={styles.item}>
          <ThemedText>{name}</ThemedText>
        </ThemedView>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  item: {
    padding: 10,
  },
});

export default ListDetailsScreen;
