import StateFade from "@/components/elements/StateFade";
import SuggestionStep from "@/components/features/Play/SuggestionStep";
import useDailySuggestion from "@/hooks/screens/useDailySuggestion";
import V from "@/skins/versus/text";
import useRaceGame from "@/skins/versus/hooks/useRaceGame";
import { router } from "expo-router";
import { useState } from "react";
import { VersusEmpty, VersusLoading } from "../States";
import Arena from "./_components/Arena";
import ExtraRound from "./_components/ExtraRound";
import Start from "./_components/Start";
import Results from "./_components/Results";
import Closed from "./_components/Closed";

const VersusPlay = () => {
  const game = useRaceGame();
  const [extra, setExtra] = useState(false);
  const [allSorted, setAllSorted] = useState(false);
  const suggestion = useDailySuggestion(game.screen === "done" && !extra);
  const playAgain = () => setExtra(true);

  const body = () => {
    if (extra) {
      return (
        <ExtraRound
          onLeave={() => setExtra(false)}
          onAllSorted={() => {
            setAllSorted(true);
            setExtra(false);
          }}
        />
      );
    }
    if (suggestion.item) return <SuggestionStep suggestion={suggestion} />;

    switch (game.screen) {
      case "loading":
        return <VersusLoading />;
      case "play":
        return <Arena game={game} />;
      case "done":
        return <Results game={game} onPlayAgain={playAgain} allSorted={allSorted} />;
      case "closed":
        return <Closed game={game} onPlayAgain={playAgain} allSorted={allSorted} />;
      case "empty":
        return (
          <VersusEmpty
            kicker={V.play.todaysRace}
            title={V.play.nothingTitle}
            line={V.play.nothingLine}
            action={{ label: V.home.checkInventory, onPress: () => router.navigate("/inventory") }}
          />
        );
      default:
        return <Start game={game} />;
    }
  };

  return <StateFade stateKey={extra ? "extra" : suggestion.item ? "suggestion" : game.screen}>{body()}</StateFade>;
};

export default VersusPlay;
