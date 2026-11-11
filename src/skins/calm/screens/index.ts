import type { SkinScreens } from "../../screens";
import CalmAccount from "./Account";
import CalmInventory from "./Inventory";
import CalmHome from "./Home";
import CalmPlay from "./Play";
import CalmShop from "./Shop";
import { CalmLoading } from "./States";
import CalmTabBar from "./TabBar";

const calmScreens: SkinScreens = {
  Home: CalmHome,
  Play: CalmPlay,
  Shop: CalmShop,
  Inventory: CalmInventory,
  Account: CalmAccount,
  Loading: CalmLoading,
  TabBar: CalmTabBar,
};

export default calmScreens;
