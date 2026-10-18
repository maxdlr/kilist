import ShopList from "@/components/views/ShopList";
import { ShopProvider } from "@/providers/ShopProvider";

const ShopView = () => {
  return (
    <ShopProvider>
      <ShopList />
    </ShopProvider>
  );
};

export default ShopView;
