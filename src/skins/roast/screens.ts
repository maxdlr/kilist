import RoastTabBar from "@/components/elements/TabBar/RoastTabBar";
import RoastAccount from "@/components/views/Account/RoastAccount";
import RoastHome from "@/components/views/Dashboard/RoastHome";
import FoodList from "@/components/views/FoodList";
import ShopList from "@/components/views/ShopList";
import SwipeFoodGame from "@/components/views/SwipeFoods/_components/SwipeFoodGame";
import type { SkinScreens } from "../screens";

const roastScreens: SkinScreens = {
  Home: RoastHome,
  Play: SwipeFoodGame,
  Shop: ShopList,
  Foods: FoodList,
  Account: RoastAccount,
  TabBar: RoastTabBar,
};

export default roastScreens;
