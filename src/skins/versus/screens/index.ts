import type { SkinScreens } from "../../screens";
import VersusAccount from "./Account";
import VersusInventory from "./Inventory";
import VersusHome from "./Home";
import VersusPlay from "./Play";
import VersusShop from "./Shop";
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
