import KilButton from "@/components/elements/KilButton";
import { ThemedView } from "@/components/themed-view";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { ListType } from "@/types/model";
import { StyleSheet } from "react-native";
import useSWR from "swr";

const ListsScreen = () => {
  const { data: mainList } = useSWR<ListType>({ url: "lists/read?main=true" });
  const id = mainList?.id ? [Number(mainList.id)] : undefined;

  return (
    <ThemedView style={styles.container}>
      <KilButton label="Start Shopping" href="/shop" />
      <KilButton label="List" href="/list" />
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
