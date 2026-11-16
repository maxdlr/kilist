import LoadingAnim from "@/components/elements/LoadingAnim";
import RoastTabBar from "@/skins/roast/screens/TabBar";
import RoastAccount from "@/skins/roast/screens/Account";
import RoastHome from "@/skins/roast/screens/Home";
import Inventory from "@/skins/roast/screens/Inventory";
import ShopList from "@/skins/roast/screens/Shop";
import SwipeFoodGame from "@/skins/roast/screens/Play";
import type { SkinScreens } from "@/skins/screens";

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
