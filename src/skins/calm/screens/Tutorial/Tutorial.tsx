import T from "@/skins/calm/text";
import Intro from "@/skins/calm/screens/Tutorial/_components/Intro";
import { ShopArt, SortArt } from "./_components/IntroArt";
import { FoodType, HouseholdWithMembersType, ListType } from "@/types/model";
import { useState } from "react";
import useSWR from "swr";
import { CalmLoading } from "../States";
import { Sample, Answer, SHOP_ROWS } from "./_components/shared";
import ProfilePick from "./_components/ProfilePick";
import Practice from "./_components/Practice";
import PracticeShop from "./_components/PracticeShop";
import Finished from "./_components/Finished";

const PRACTICE_CARDS = 3;

const INTRO_ART = { 1: <SortArt />, 2: <ShopArt /> };

type Step = "intro" | "profile" | "practice" | "shop" | "done";

const CalmTutorial = ({
  withIntro,
  foodsOnly,
  refine = false,
  onDone,
  onExit,
}: {
  withIntro: boolean;
  foodsOnly: boolean;
  refine?: boolean;
  onDone: (startRound: boolean) => void;
  onExit?: () => void;
}) => {
  const copy = T.tutorial;
  const { data: mainList } = useSWR<ListType & { foods?: FoodType[] }>({
    url: "lists/read?main=true",
  });
  const { data: household } = useSWR<HouseholdWithMembersType>({
    url: "/households/me",
  });
  const [step, setStep] = useState<Step>(withIntro ? "intro" : "profile");
  const [trail, setTrail] = useState<Step[]>([]);
  const [added, setAdded] = useState<Sample[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  if (!mainList || !household) return <CalmLoading />;

  const inventory = mainList.foods ?? [];
  const joined = household.members.length > 1;
  const candidates: Sample[] = [
    ...added,
    ...inventory,
    ...copy.samples.map((name) => ({ name })),
  ].filter(
    (item, index, list) =>
      list.findIndex((other) => other.name === item.name) === index,
  );
  const samples = candidates.slice(0, PRACTICE_CARDS);
  const spares = candidates.slice(PRACTICE_CARDS, PRACTICE_CARDS + SHOP_ROWS);

  const finish = (startRound: boolean) => {
    onDone(startRound);
  };

  const go = (next: Step, canReturn = true) => {
    setTrail((list) => (canReturn ? [...list, step] : []));
    setStep(next);
  };
  const previous = trail[trail.length - 1];
  const back = previous
    ? () => {
        setTrail((list) => list.slice(0, -1));
        setStep(previous);
      }
    : undefined;
  const nav = { onBack: back, onExit };

  if (refine)
    return (
      <ProfilePick
        listId={mainList.id}
        owned={inventory}
        onDone={() => finish(false)}
        onExit={onExit}
      />
    );

  if (step === "intro") {
    return (
      <Intro
        art={INTRO_ART}
        onExit={onExit}
        onDone={() =>
          go(
            (inventory.length > 0 || joined) && !foodsOnly
              ? "practice"
              : "profile",
          )
        }
      />
    );
  }

  if (step === "profile") {
    return (
      <ProfilePick
        listId={mainList.id}
        {...nav}
        onDone={(items) => {
          setAdded(items);
          if (foodsOnly) finish(false);
          else go("practice", false);
        }}
      />
    );
  }

  if (step === "practice") {
    return (
      <Practice
        samples={samples}
        initialAnswers={answers}
        {...nav}
        onSkip={() => finish(false)}
        onDone={(result) => {
          setAnswers(result);
          go("shop");
        }}
      />
    );
  }

  if (step === "shop")
    return (
      <PracticeShop
        answers={answers}
        spares={spares}
        {...nav}
        onDone={() => go("done")}
      />
    );

  return <Finished {...nav} onStart={() => finish(true)} />;
};

export default CalmTutorial;
