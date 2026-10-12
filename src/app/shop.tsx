import Session from "@/components/views/Session/Session";
import { ShopProvider } from "@/providers/ShopProvider";

const ShopView = () => {
  return (
    <ShopProvider>
      <Session />
    </ShopProvider>
  );
};

export default ShopView;
