import BackBar from "@/components/elements/BackBar/BackBar";
import LooksShowcase from "@/components/views/Account/_components/LooksShowcase";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin } from "@/providers/SkinProvider";
import { useLocalSearchParams } from "expo-router";

const LooksScreen = () => {
  const skin = useSkin();
  const { skin: focus } = useLocalSearchParams<{ skin?: string }>();
  useStatusBarStyle(skin.statusBarOnGround);

  return (
    <BackBar>
      <LooksShowcase focus={focus} titleColor={skin.colors.onGround} />
    </BackBar>
  );
};

export default LooksScreen;
