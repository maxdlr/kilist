import { useSkin } from "@/providers/SkinProvider";
import { versusPalette as P } from "../theme/palette";
import { VText } from "./VText";

export const Kicker = ({ children }: { children: string }) => {
  const skin = useSkin();
  return (
    <VText face="pixel" size={(skin.type.caption - 1) - 3} color={P.muted}>
      {children.toUpperCase()}
    </VText>
  );
};
