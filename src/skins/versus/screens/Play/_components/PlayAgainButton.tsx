import { PlayIcon } from "@/components/icons";
import { useSkin } from "@/providers/SkinProvider";
import { VButton, VText } from "@/skins/versus/components";
import { versusPalette as P } from "@/skins/versus/theme/palette";

const PlayAgainButton = ({ onPress, allSorted }: { onPress: () => void; allSorted: boolean }) => {
  const skin = useSkin();
  if (allSorted) {
    return (
      <VText face="bold" size={skin.type.lead} color={P.agree} style={{ textAlign: "center" }}>
        {skin.copy.swipe.allChecked}
      </VText>
    );
  }
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
