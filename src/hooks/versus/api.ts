import axios from "@/services/axios";
import { FoodType } from "@/types/model";
import { useMemo } from "react";
import useSWR from "swr";

export type RaceAnswer = "in" | "out" | "up";

export type Member = { id: number; username: string };

export type RaceRunAnswer = { foodId: number; answer: RaceAnswer; ms: number };

export type RaceRun = {
  userId: number;
  username: string;
  answers: RaceRunAnswer[];
  totalMs: number | null;
  finished: boolean;
};

export type RaceTarget = {
  kind: "mate" | "best";
  userId: number;
  username: string;
  totalMs: number;
  splits: number[];
  day?: string;
};

export type RaceView = {
  day: string;
  level: number;
  raceId: number | null;
  foods: FoodType[];
  members: Member[];
  runs: RaceRun[];
  target: RaceTarget | null;
  previousAnswers: Record<number, { answer: RaceAnswer; day: string }>;
};

export type Verdict = { result: "needed" | "stocked" | "tied"; out: number; in: number };

export type AnswerResult = {
  reward: { earned: number; bonus: number; balance: number | null };
  finished: boolean;
  totalMs: number | null;
  mates: { userId: number; username: string; answer: RaceAnswer; ms: number }[];
  verdict: Verdict | null;
};

export type StandingRow = {
  userId: number;
  username: string;
  wins: number;
  plays: number;
  avgMs: number | null;
  rightPct: number | null;
};

export type Standings = {
  period: "week" | "season";
  day: string;
  members: StandingRow[];
  today: { userId: number; username: string; played: boolean; totalMs: number | null }[];
  lastClash: {
    day: string;
    foodId: number;
    votes: { userId: number; username: string; answer: RaceAnswer }[];
    verdict: Verdict | null;
  } | null;
};

export type VersusMe = {
  headToHead: {
    userId: number;
    username: string;
    wins: number;
    losses: number;
    clashes: number;
    rightInClashes: number;
    shopRecord: "you" | "them" | null;
  }[];
  personal: {
    bestRaceMs: number | null;
    bestShopMs: number | null;
    streak: number;
    changedMindPct: number | null;
    newBests: number;
    recent: { day: string; totalMs: number }[];
  };
};

export type ShopRun = {
  userId: number;
  username: string;
  ms: number;
  items: number;
  splits: number[];
  endedAt: string;
};

export type ShopRecords = {
  houseRecord: ShopRun | null;
  myBest: ShopRun | null;
  runsByMember: Record<number, number>;
};

export type HouseVotes = {
  members: Member[];
  votes: Record<number, Record<number, { answer: RaceAnswer; at: string }>>;
};

const useTzOffset = () => useMemo(() => new Date().getTimezoneOffset(), []);

export const useRace = () => {
  const tzOffset = useTzOffset();
  return useSWR<RaceView>({ url: "/versus/race", params: { tzOffset } });
};

export const useStandings = (period: "week" | "season") => {
  const tzOffset = useTzOffset();
  return useSWR<Standings>({ url: "/versus/standings", params: { tzOffset, period } });
};

export const useVersusMe = () => {
  const tzOffset = useTzOffset();
  return useSWR<VersusMe>({ url: "/versus/me", params: { tzOffset } });
};

export const useShopRecords = () => useSWR<ShopRecords>({ url: "/versus/shop" });

export const useHouseVotes = () => useSWR<HouseVotes>({ url: "/versus/votes" });

export const postAnswer = async (
  raceId: number,
  payload: { foodId: number; answer: RaceAnswer; ms: number },
) => (await axios.post<AnswerResult>(`/versus/race/${raceId}/answer`, payload)).data;

export const verdictOf = (answers: RaceAnswer[]): Verdict | null => {
  const out = answers.filter((answer) => answer === "out").length;
  const inStock = answers.filter((answer) => answer === "in").length;
  if (out + inStock === 0) return null;
  return {
    result: out > inStock ? "needed" : inStock > out ? "stocked" : "tied",
    out,
    in: inStock,
  };
};

export const seconds = (ms: number | null | undefined) =>
  ms === null || ms === undefined ? "–" : `${(ms / 1000).toFixed(1)}s`;

export const clock = (ms: number) => {
  const total = Math.max(0, ms) / 1000;
  const minutes = Math.floor(total / 60);
  const rest = total - minutes * 60;
  return `${minutes}:${rest.toFixed(1).padStart(4, "0")}`;
};

export const mmss = (ms: number | null | undefined) => {
  if (ms === null || ms === undefined) return "–";
  const total = Math.floor(Math.max(0, ms) / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
