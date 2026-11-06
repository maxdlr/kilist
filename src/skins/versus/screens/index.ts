import type { SkinScreens } from "../../screens";
import VersusAccount from "./Account";
import VersusFoods from "./Foods";
import VersusHome from "./Home";
import VersusPlay from "./Play";
import VersusShop from "./Shop";
import VersusTabBar from "./TabBar";

const versusScreens: SkinScreens = {
  Home: VersusHome,
  Play: VersusPlay,
  Shop: VersusShop,
  Foods: VersusFoods,
  Account: VersusAccount,
  TabBar: VersusTabBar,
};

export default versusScreens;
