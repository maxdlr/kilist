import { ThemedView } from "@/components/themed-view";
import ShopList from "@/components/views/ShopList";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { FoodListProvider } from "@/providers/FoodListProvider";
import { ListType } from "@/types/model";
import { StyleSheet } from "react-native";
import useSWR from "swr";

const ShopView = () => {
  const { data: mainList } = useSWR<ListType>({ url: "lists/read?main=true" });
  const id = mainList?.id ? [Number(mainList.id)] : undefined;

  return (
    <ThemedView style={styles.container}>
      <FoodListProvider listIds={id}>
        <ShopList />
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

export default ShopView;
