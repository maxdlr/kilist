import Inventory from "@/components/views/Inventory";
import RequireAuth from "@/components/RequireAuth";
import { InventoryProvider } from "@/providers/InventoryProvider";
import { useLocalSearchParams } from "expo-router";

const ListDetailsScreen = () => {
  const { id } = useLocalSearchParams();

  return (
    <RequireAuth>
      <InventoryProvider listIds={[Number(id)]}>
        <Inventory />
      </InventoryProvider>
    </RequireAuth>
  );
};

export default ListDetailsScreen;
