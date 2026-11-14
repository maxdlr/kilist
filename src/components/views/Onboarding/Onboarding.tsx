import BackBar from "@/components/elements/BackBar/BackBar";
import { SkinOverride } from "@/providers/SkinProvider";
import { DEFAULT_SKIN_ID } from "@/skins";
import CalmTutorial from "@/skins/calm/screens/Tutorial";
import type { Href } from "expo-router";

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
  const tutorial = <CalmTutorial withIntro={intro} foodsOnly={!intro} refine={refine} onDone={onDone} />;

  return (
    <SkinOverride id={DEFAULT_SKIN_ID}>
      {backTo ? <BackBar fallback={backTo}>{tutorial}</BackBar> : tutorial}
    </SkinOverride>
  );
};

export default Onboarding;
