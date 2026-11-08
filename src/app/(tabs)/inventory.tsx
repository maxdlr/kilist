import { MaxContentWidth } from "@/constants/theme";
import { InventoryProvider } from "@/providers/InventoryProvider";
import { SkinScreen } from "@/skins/screens";
import { ListType } from "@/types/model";
import { StyleSheet, View } from "react-native";
import useSWR from "swr";

const ListsScreen = () => {
  const { data: mainList } = useSWR<ListType>({ url: "lists/read?main=true" });
  const id = mainList?.id ? [Number(mainList.id)] : undefined;

  return (
    <View style={styles.container}>
      <InventoryProvider listIds={id}>
        <SkinScreen slot="Inventory" />
      </InventoryProvider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
});

export default ListsScreen;
