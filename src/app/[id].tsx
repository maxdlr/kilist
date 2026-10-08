import FoodList from "@/components/views/FoodList";
import { FoodListProvider } from "@/providers/FoodListProvider";
import { useLocalSearchParams } from "expo-router";

const ListDetailsScreen = () => {
  const { id } = useLocalSearchParams();

  return (
    <FoodListProvider listIds={[Number(id)]}>
      <FoodList />
    </FoodListProvider>
  );
};

export default ListDetailsScreen;
