import { ShopListProvider } from "@/providers/ShopListProvider";
import { SkinScreen } from "@/skins/screens";

const ShopScreen = () => {
  return (
    <ShopListProvider>
      <SkinScreen slot="Shop" />
    </ShopListProvider>
  );
};

export default ShopScreen;
