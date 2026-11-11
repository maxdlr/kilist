import { SkinOverride } from "@/providers/SkinProvider";
import { DEFAULT_SKIN_ID } from "@/skins";
import CalmTutorial from "@/skins/calm/screens/Tutorial";

const Onboarding = ({
  onDone,
  intro = false,
}: {
  onDone: (startRound: boolean) => void;
  intro?: boolean;
}) => (
  <SkinOverride id={DEFAULT_SKIN_ID}>
    <CalmTutorial withIntro={intro} foodsOnly={!intro} onDone={onDone} />
  </SkinOverride>
);

export default Onboarding;
