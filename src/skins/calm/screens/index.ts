import type { SkinScreens } from "../../screens";
import CalmAccount from "./Account";
import CalmFoods from "./Foods";
import CalmHome from "./Home";
import CalmPlay from "./Play";
import CalmShop from "./Shop";
import CalmTabBar from "./TabBar";

const calmScreens: SkinScreens = {
  Home: CalmHome,
  Play: CalmPlay,
  Shop: CalmShop,
  Foods: CalmFoods,
  Account: CalmAccount,
  TabBar: CalmTabBar,
};

export default calmScreens;
