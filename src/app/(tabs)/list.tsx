import { ThemedView } from "@/components/themed-view";
import FoodList from "@/components/views/FoodList";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { FoodListProvider } from "@/providers/FoodListProvider";
import { ListType } from "@/types/model";
import { ScrollView, StyleSheet } from "react-native";
import useSWR from "swr";

const ListsScreen = () => {
  const { data: mainList } = useSWR<ListType>({ url: "lists/read?main=true" });
  const id = mainList?.id ? [Number(mainList.id)] : undefined;

  return (
    <ScrollView style={styles.container}>
      <FoodListProvider listIds={id}>
        <FoodList />
      </FoodListProvider>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
});

export default ListsScreen;
