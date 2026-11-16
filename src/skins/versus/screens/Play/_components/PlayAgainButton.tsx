import { PlayIcon } from "@/components/icons";
import { useSkin } from "@/providers/SkinProvider";
import { VButton } from "@/skins/versus/components";

const PlayAgainButton = ({ onPress }: { onPress: () => void }) => {
  const skin = useSkin();
  return (
    <VButton
      variant="secondary"
      label={skin.copy.swipe.playAgain}
      icon={(color) => <PlayIcon size={skin.size.icon.action} color={color} />}
      onPress={onPress}
    />
  );
};

export default PlayAgainButton;
