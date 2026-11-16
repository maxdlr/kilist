import type { SkinScreens } from "../../screens";
import CalmAccount from "./Account/Account";
import CalmInventory from "./Inventory/Inventory";
import CalmHome from "./Home/Home";
import CalmPlay from "./Play/Play";
import CalmShop from "./Shop/Shop";
import { CalmLoading } from "./States";
import CalmTabBar from "./TabBar";
import { GlassScene } from "../components";

const calmScreens: SkinScreens = {
  Home: CalmHome,
  Play: CalmPlay,
  Shop: CalmShop,
  Inventory: CalmInventory,
  Account: CalmAccount,
  Loading: CalmLoading,
  TabBar: CalmTabBar,
  floatingTabBar: true,
  Scene: GlassScene,
};

export default calmScreens;
