import type { SkinScreens } from "../../screens";
import ArcadeAccount from "./Account";
import ArcadeInventory from "./Inventory";
import ArcadeHome from "./Home";
import ArcadePlay from "./Play";
import ArcadeShop from "./Shop";
import { ArcadeLoading } from "./States";
import ArcadeTabBar from "./TabBar";

const arcadeScreens: SkinScreens = {
  Home: ArcadeHome,
  Play: ArcadePlay,
  Shop: ArcadeShop,
  Inventory: ArcadeInventory,
  Account: ArcadeAccount,
  Loading: ArcadeLoading,
  TabBar: ArcadeTabBar,
};

export default arcadeScreens;
