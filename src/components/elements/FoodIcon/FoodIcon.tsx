import { SvgXml } from "react-native-svg";
import foodIcons from "./foodIcons";

const FoodIcon = ({ name, size = 160 }: { name?: string | null; size?: number }) => {
  const xml = (name && foodIcons[name]) || foodIcons.placeholder;

  return <SvgXml xml={xml} width={size} height={size} />;
};

export default FoodIcon;
