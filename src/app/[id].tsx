import FoodList from "@/components/views/FoodList";
import RequireAuth from "@/components/RequireAuth";
import { FoodListProvider } from "@/providers/FoodListProvider";
import { useLocalSearchParams } from "expo-router";

const ListDetailsScreen = () => {
  const { id } = useLocalSearchParams();

  return (
    <RequireAuth>
      <FoodListProvider listIds={[Number(id)]}>
        <FoodList />
      </FoodListProvider>
    </RequireAuth>
  );
};

export default ListDetailsScreen;
