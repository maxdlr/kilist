import type { Member } from "../hooks/api";
import { useSkin } from "@/providers/SkinProvider";
import { View } from "react-native";
import { versusPalette as P } from "../theme/palette";
import { VText } from "./VText";

export const memberColor = (members: Member[], myId: number | undefined, userId: number) => {
  if (userId === myId) return P.you;
  const mates = members.filter((member) => member.id !== myId);
  const index = Math.max(0, mates.findIndex((member) => member.id === userId));
  return P.mates[Math.abs(index) % P.mates.length]!;
};

export const initialOf = (name: string) => name.trim().charAt(0).toUpperCase() || "?";

export const Avatar = ({
  name,
  color,
  size,
  ghost = false,
  dim = false,
}: {
  name: string;
  color: string;
  size: number;
  ghost?: boolean;
  dim?: boolean;
}) => {
  const skin = useSkin();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        alignItems: "center",
        backgroundColor: ghost ? P.ground : color,
        borderColor: color,
        borderRadius: size,
        borderStyle: ghost ? "dashed" : "solid",
        borderWidth: ghost ? skin.shape.border + 1 : 0,
        height: size,
        justifyContent: "center",
        opacity: dim ? 0.5 : 1,
        width: size,
      }}
    >
      <VText face="display" size={size * 0.42} color={ghost ? P.youSoft : P.ink}>
        {initialOf(name)}
      </VText>
    </View>
  );
};
