import LoadingAnim from "@/components/elements/LoadingAnim/LoadingAnim";
import RoastTabBar from "@/components/elements/TabBar/RoastTabBar";
import RoastAccount from "@/components/views/Account/RoastAccount";
import RoastHome from "@/components/views/Dashboard/RoastHome";
import Inventory from "@/components/views/Inventory";
import ShopList from "@/components/views/ShopList";
import SwipeFoodGame from "@/components/views/SwipeFoods/_components/SwipeFoodGame";
import type { SkinScreens } from "../screens";

const roastScreens: SkinScreens = {
  Home: RoastHome,
  Play: SwipeFoodGame,
  Shop: ShopList,
  Inventory: Inventory,
  Account: RoastAccount,
  Loading: LoadingAnim,
  TabBar: RoastTabBar,
};

export default roastScreens;
