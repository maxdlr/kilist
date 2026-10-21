import ShopList from "@/components/views/ShopList";
import { ShopListProvider } from "@/providers/ShopListProvider";

const ShopListView = () => {
  return (
    <ShopListProvider>
      <ShopList />
    </ShopListProvider>
  );
};

export default ShopListView;
