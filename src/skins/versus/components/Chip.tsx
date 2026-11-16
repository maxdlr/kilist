import { useSkin } from "@/providers/SkinProvider";
import { View } from "react-native";
import { versusPalette as P } from "../theme/palette";
import { VText } from "./VText";

export const Chip = ({ label, fill, ink = P.ink, dashed = false }: { label: string; fill: string; ink?: string; dashed?: boolean }) => {
  const skin = useSkin();
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: dashed ? "transparent" : fill,
        borderColor: fill,
        borderRadius: 999,
        borderStyle: dashed ? "dashed" : "solid",
        borderWidth: dashed ? skin.shape.border : 0,
        paddingHorizontal: skin.spacing.small + 2,
        paddingVertical: dashed ? skin.spacing.hair : skin.spacing.tight,
      }}
    >
      <VText face="bold" size={skin.type.caption} color={dashed ? fill : ink}>
        {label}
      </VText>
    </View>
  );
};
