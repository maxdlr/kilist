import { useSkin } from "@/providers/SkinProvider";
import { calmColors } from "../themes";

export { calmColors };

export const useCalmColors = () => calmColors(useSkin());
