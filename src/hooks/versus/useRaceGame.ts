import type { SwipeDeckFling, SwipeDirection } from "@/components/elements/SwipeDeck/SwipeDeck";
import useAuth from "@/providers/AuthProvider";
import useTickets from "@/providers/TicketsProvider";
import useToast from "@/providers/ToastProvider";
import { FoodType } from "@/types/model";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnswerResult, postAnswer, RaceAnswer, RaceRun, useRace, verdictOf } from "./api";

const ANSWER: Record<SwipeDirection, RaceAnswer> = { right: "in", left: "out", up: "up" };
const REVEAL_MS = 1300;
const CLOCK_MS = 100;

export type Reveal = {
  food: FoodType;
  mine: RaceAnswer;
  mates: AnswerResult["mates"];
  verdict: AnswerResult["verdict"];
  previous: { answer: RaceAnswer; day: string } | null;
};

const useRaceGame = () => {
  const { user } = useAuth();
  const tickets = useTickets();
  const { showToast } = useToast();
  const { data: race, isLoading, mutate } = useRace();
  const [phase, setPhase] = useState<"idle" | "play" | "done">("idle");
  const [answers, setAnswers] = useState<Record<number, RaceAnswer>>({});
  const [elapsed, setElapsed] = useState(0);
  const [intent, setIntent] = useState<SwipeDirection | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [earned, setEarned] = useState(0);
  const flingRef = useRef<SwipeDeckFling | null>(null);
  const startedAt = useRef(0);
  const lastAt = useRef(0);
  const clockTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      mutate();
      return () => setPhase((current) => (current === "done" ? "idle" : current));
    }, [mutate]),
  );

  useEffect(
    () => () => {
      if (clockTimer.current) clearInterval(clockTimer.current);
      if (revealTimer.current) clearTimeout(revealTimer.current);
    },
    [],
  );

  const myId = user?.id;
  const myRun = race?.runs.find((run) => run.userId === myId);
  const mateRuns = race?.runs.filter((run) => run.userId !== myId) ?? [];
  const isSolo = (race?.members.length ?? 1) <= 1;
  const answeredOnServer = useMemo(
    () => new Set(myRun?.answers.map((answer) => answer.foodId) ?? []),
    [myRun],
  );
  const foods = (race?.foods ?? []).filter(
    (food) => !answeredOnServer.has(food.id) && answers[food.id] === undefined,
  );
  const position = (race?.foods.length ?? 0) - foods.length;

  const stopClock = () => {
    if (clockTimer.current) clearInterval(clockTimer.current);
    clockTimer.current = null;
  };

  const begin = () => {
    const now = Date.now();
    startedAt.current = now - (myRun ? myRun.answers.reduce((sum, answer) => sum + answer.ms, 0) : 0);
    lastAt.current = now;
    setAnswers({});
    setEarned(0);
    setReveal(null);
    setElapsed(now - startedAt.current);
    stopClock();
    clockTimer.current = setInterval(() => setElapsed(Date.now() - startedAt.current), CLOCK_MS);
    setPhase("play");
  };

  const handleSwipe = async (food: FoodType, direction: SwipeDirection) => {
    if (!race?.raceId) return;
    const now = Date.now();
    const ms = now - lastAt.current;
    lastAt.current = now;
    const answer = ANSWER[direction];
    setAnswers((current) => ({ ...current, [food.id]: answer }));

    try {
      const result = await postAnswer(race.raceId, { foodId: food.id, answer, ms });
      setEarned((total) => total + result.reward.earned);
      if (result.reward.balance !== null) tickets.setBalance(result.reward.balance);
      if (revealTimer.current) clearTimeout(revealTimer.current);
      setReveal({
        food,
        mine: answer,
        mates: result.mates,
        verdict: result.verdict,
        previous: race.previousAnswers[food.id] ?? null,
      });
      revealTimer.current = setTimeout(() => setReveal(null), REVEAL_MS);
      if (result.finished) {
        stopClock();
        setElapsed(result.totalMs ?? Date.now() - startedAt.current);
        await mutate();
        tickets.refresh();
        setPhase("done");
      }
    } catch (error: any) {
      setAnswers((current) => {
        const next = { ...current };
        delete next[food.id];
        return next;
      });
      showToast(error?.response?.data?.message || "Couldn't save that answer");
    }
  };

  const target = race?.target ?? null;
  const targetAt = (index: number) =>
    target && index > 0 ? target.splits[Math.min(index, target.splits.length) - 1] ?? null : 0;
  let ghostDone = 0;
  while (target && ghostDone < target.splits.length && target.splits[ghostDone]! <= elapsed) ghostDone += 1;

  const finishedRuns: RaceRun[] = race?.runs.filter((run) => run.finished) ?? [];
  const clashes = (race?.foods ?? [])
    .map((food) => {
      const mine = myRun?.answers.find((answer) => answer.foodId === food.id)?.answer;
      const votes = finishedRuns
        .filter((run) => run.userId !== myId)
        .map((run) => ({ run, answer: run.answers.find((entry) => entry.foodId === food.id)?.answer }))
        .filter((vote): vote is { run: RaceRun; answer: RaceAnswer } => Boolean(vote.answer));
      return { food, mine, votes };
    })
    .filter(({ mine, votes }) => mine && votes.some((vote) => vote.answer !== mine))
    .map(({ food, mine, votes }) => ({
      food,
      mine: mine!,
      votes,
      verdict: verdictOf([mine!, ...votes.map((vote) => vote.answer)]),
    }));

  const changes = (race?.foods ?? [])
    .map((food) => ({
      food,
      mine: myRun?.answers.find((answer) => answer.foodId === food.id)?.answer,
      previous: race?.previousAnswers[food.id],
    }))
    .filter((entry) => entry.mine && entry.previous && entry.previous.answer !== entry.mine);

  const screen =
    phase === "done"
      ? "done"
      : !race && isLoading
        ? "loading"
        : phase === "play" && foods.length
          ? "play"
          : myRun?.finished
            ? "closed"
            : !race?.raceId
              ? "empty"
              : "start";

  return {
    screen,
    race,
    isSolo,
    myRun,
    mateRuns,
    foods,
    position,
    total: race?.foods.length ?? 0,
    elapsed,
    target,
    targetAt,
    ghostDone,
    intent,
    setIntent,
    reveal,
    earned,
    flingRef,
    fling: (direction: SwipeDirection) => flingRef.current?.(direction),
    begin,
    handleSwipe,
    reset: () => setPhase("idle"),
    refresh: () => mutate(),
    clashes,
    changes,
    balance: tickets.counter?.balance,
  };
};

export type RaceGame = ReturnType<typeof useRaceGame>;

export default useRaceGame;
