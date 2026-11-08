import type { SkinScreens } from "../../screens";
import ArcadeAccount from "./Account";
import ArcadeInventory from "./Inventory";
import ArcadeHome from "./Home";
import ArcadePlay from "./Play";
import ArcadeShop from "./Shop";
import ArcadeTabBar from "./TabBar";

const arcadeScreens: SkinScreens = {
  Home: ArcadeHome,
  Play: ArcadePlay,
  Shop: ArcadeShop,
  Inventory: ArcadeInventory,
  Account: ArcadeAccount,
  TabBar: ArcadeTabBar,
};

export default arcadeScreens;
