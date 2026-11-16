import { useSkin } from "@/providers/SkinProvider";
import { View } from "react-native";
import { PencilIcon } from "react-native-heroicons/solid";

const EditBadge = () => {
  const skin = useSkin();
  const size = skin.size.icon.row;
  const { fill, ink, line } = skin.actions.secondary;

  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: fill,
        borderColor: line,
        borderRadius: size / 2,
        borderWidth: skin.shape.border,
        height: size,
        justifyContent: "center",
        width: size,
      }}
    >
      <PencilIcon size={size * 0.45} color={ink} />
    </View>
  );
};

export default EditBadge;
