import { useSkin } from "@/providers/SkinProvider";
import { calmColors } from "./index";

export { calmColors };

export const useCalmColors = () => calmColors(useSkin());
