import StateFade from "@/components/elements/StateFade";
import SuggestionStep from "@/components/features/Play/SuggestionStep";
import useDailySuggestion from "@/hooks/screens/useDailySuggestion";
import useSwipeGame from "@/hooks/screens/useSwipeGame";
import { useSkin } from "@/providers/SkinProvider";
import { useEffect } from "react";
import T from "@/skins/calm/text";
import { CButton } from "@/skins/calm/components";
import { CalmLoading, CalmMessage } from "../States";
import Checking from "./_components/Checking";
import Recap from "./_components/Recap";

const CalmPlay = () => {
  const skin = useSkin();
  const game = useSwipeGame();
  const copy = skin.copy.swipe;
  const { screen, begin } = game;

  const suggestion = useDailySuggestion(screen === "done" && game.mode === "daily");

  useEffect(() => {
    if (screen === "start") begin();
  }, [screen, begin]);

  const body = () => {
    if (suggestion.item) return <SuggestionStep suggestion={suggestion} />;

    switch (screen) {
      case "play":
        return <Checking game={game} />;
      case "done":
      case "closed":
        return <Recap game={game} />;
      case "empty":
        return (
          <CalmMessage
            title={copy.emptyTitle}
            line={copy.emptyLine}
            dock={
              <CButton
                variant="text"
                label={T.browseInventory}
                href="/inventory"
              />
            }
          />
        );
      default:
        return <CalmLoading />;
    }
  };

  return (
    <StateFade
      stateKey={
        suggestion.item
          ? "suggestion"
          : screen === "start"
            ? "loading"
            : screen === "closed"
              ? "done"
              : screen
      }
    >
      {body()}
    </StateFade>
  );
};

export default CalmPlay;
