import BackBar from "@/components/elements/BackBar";
import LooksShowcase from "@/components/features/Looks/LooksShowcase";
import useStatusBarStyle from "@/hooks/useStatusBarStyle";
import { useSkin } from "@/providers/SkinProvider";
import { SkinScene } from "@/skins/screens";
import { useLocalSearchParams } from "expo-router";

const LooksScreen = () => {
  const skin = useSkin();
  const { skin: focus } = useLocalSearchParams<{ skin?: string }>();
  useStatusBarStyle(skin.statusBarOnGround);

  return (
    <BackBar>
      <SkinScene>
        <LooksShowcase focus={focus} titleColor={skin.colors.onGround} />
      </SkinScene>
    </BackBar>
  );
};

export default LooksScreen;
