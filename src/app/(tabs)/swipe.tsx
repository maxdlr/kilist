import { SwipeFoodsProvider } from "@/providers/SwipeFoodsProvider";
import { SkinScreen } from "@/skins/screens";

const SwipeScreen = () => {
  return (
    <SwipeFoodsProvider>
      <SkinScreen slot="Play" />
    </SwipeFoodsProvider>
  );
};

export default SwipeScreen;
