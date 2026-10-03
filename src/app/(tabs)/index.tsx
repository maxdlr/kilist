import FoodList from "@/components/elements/Foods";
import ListsList from "@/components/elements/Lists/ListsList";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { FoodListProvider } from "@/providers/FoodListProvider";
import { ListType } from "@/types/model";
import { StyleSheet } from "react-native";
import useSWR from "swr";

const ListsScreen = () => {
  const { data: mainList } = useSWR<ListType>({ url: "lists/read?main=true" });

  return (
    <ThemedView style={styles.container}>
      <FoodListProvider listIds={[Number(mainList?.id)]}>
        <FoodList />
      </FoodListProvider>
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
