import SwipeFoodGame from "@/components/views/SwipeFoods/_components/SwipeFoodGame";
import { SwipeFoodsProvider } from "@/providers/SwipeFoodsProvider";

const SwipeScreen = () => {
  return (
    <SwipeFoodsProvider>
      <SwipeFoodGame />
    </SwipeFoodsProvider>
  );
};

export default SwipeScreen;
