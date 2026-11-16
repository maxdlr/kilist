import type { SkinScreens } from "../../screens";
import VersusAccount from "./Account/Account";
import VersusInventory from "./Inventory/Inventory";
import VersusHome from "./Home/Home";
import VersusPlay from "./Play/Play";
import VersusShop from "./Shop/Shop";
import { VersusLoading } from "./States";
import VersusTabBar from "./TabBar";

const versusScreens: SkinScreens = {
  Home: VersusHome,
  Play: VersusPlay,
  Shop: VersusShop,
  Inventory: VersusInventory,
  Account: VersusAccount,
  Loading: VersusLoading,
  TabBar: VersusTabBar,
};

export default versusScreens;
