import BackBar from "@/components/elements/BackBar/BackBar";
import LookPreview from "@/components/views/Account/_components/LookPreview";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin } from "@/providers/SkinProvider";
import { useLocalSearchParams } from "expo-router";

const LookPreviewScreen = () => {
  const skin = useSkin();
  const { skin: id } = useLocalSearchParams<{ skin?: string }>();
  useStatusBarStyle(skin.statusBarOnGround);

  return (
    <BackBar fallback="/looks">
      <LookPreview skinId={id} />
    </BackBar>
  );
};

export default LookPreviewScreen;
