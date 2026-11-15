import { SkinOverride } from "@/providers/SkinProvider";
import { DEFAULT_SKIN_ID } from "@/skins";
import CalmTutorial from "@/skins/calm/screens/Tutorial";
import { type Href, router } from "expo-router";

const Onboarding = ({
  onDone,
  intro = false,
  refine = false,
  backTo,
}: {
  onDone: (startRound: boolean) => void;
  intro?: boolean;
  refine?: boolean;
  backTo?: Href;
}) => {
  const exit = backTo ? () => (router.canGoBack() ? router.back() : router.replace(backTo)) : undefined;

  return (
    <SkinOverride id={DEFAULT_SKIN_ID}>
      <CalmTutorial withIntro={intro} foodsOnly={!intro} refine={refine} onDone={onDone} onExit={exit} />
    </SkinOverride>
  );
};

export default Onboarding;
