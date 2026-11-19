import { rules } from "./rules";
import type { HistoryEntry } from "./types";

const DAY_MS = 24 * 3600000;

const UNITS: Record<string, number> = { kg: 1000, g: 1, l: 1000, cl: 10, ml: 1 };
const PACK = /(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|l|cl|ml)\b/i;

const time = (value?: string | null) => {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

export type CycleFood = {
  quantity?: string | null;
  boughtDates?: string[] | null;
  frequencyDays?: number | null;
};

export type CycleSource = "declared" | "rhythm" | "pack" | "fallback";

export type CycleEstimate = { source: CycleSource; days: number; trust: number };

export const packSize = (quantity?: string | null): number | null => {
  const match = quantity?.match(PACK);
  if (!match) return null;
  const count = match[1] ? Number(match[1]) : 1;
  return count * Number(match[2]!.replace(",", ".")) * UNITS[match[3]!.toLowerCase()]!;
};

export const buyGapDays = (dates?: string[] | null) => {
  const rhythm = rules().rhythm;
  const times = (dates ?? []).map(time).sort((a, b) => a - b);
  if (!rhythm || times.length < rhythm.minPurchases) return null;
  const gaps = times.slice(1).map((date, index) => date - times[index]!).sort((a, b) => a - b);
  const middle = Math.floor(gaps.length / 2);
  const median = gaps.length % 2 ? gaps[middle]! : (gaps[middle - 1]! + gaps[middle]!) / 2;
  return median / DAY_MS;
};

export const cycleEstimates = (food: CycleFood): CycleEstimate[] => {
  const score = rules().score;
  const trust = score?.trust;
  const estimates: CycleEstimate[] = [];
  if (food.frequencyDays) {
    estimates.push({ source: "declared", days: food.frequencyDays, trust: trust?.declared ?? 1 });
  }
  const gap = buyGapDays(food.boughtDates);
  if (gap !== null && gap > 0) {
    const gaps = (food.boughtDates?.length ?? 1) - 1;
    estimates.push({ source: "rhythm", days: gap, trust: (trust?.perPurchaseGap ?? 1) * gaps });
  }
  if (estimates.length > 0 || !score) return estimates;
  if ((packSize(food.quantity) ?? 0) >= rules().swipe.bigPackSize) {
    estimates.push({ source: "pack", days: score.bigPackCycleDays, trust: score.trust.pack });
  }
  estimates.push({ source: "fallback", days: score.defaultCycleDays, trust: score.trust.fallback });
  return estimates;
};

export const cycleOf = (food: CycleFood) => {
  const estimates = cycleEstimates(food);
  const total = estimates.reduce((sum, estimate) => sum + estimate.trust, 0);
  const logDays = estimates.reduce((sum, estimate) => sum + estimate.trust * Math.log(estimate.days), 0);
  const days = total > 0 ? Number(Math.exp(logDays / total).toFixed(2)) : null;
  const known = estimates.some((estimate) => estimate.source === "declared" || estimate.source === "rhythm");
  return { days, known, estimates };
};

export const halfLifeDays = (cycleDays: number | null) => {
  const score = rules().score;
  if (!score || cycleDays === null) return Infinity;
  return Math.max(score.minHalfLifeDays, cycleDays * score.halfLifeShare);
};

export const scoreOf = (answers: HistoryEntry[], halfLife: number) => {
  if (answers.length === 0) return 1;
  const times = answers.map((answer) => time(answer.at));
  const latest = Math.max(...times);
  let total = 0;
  let inStock = 0;
  answers.forEach((answer, index) => {
    const weight = Number.isFinite(halfLife) ? 0.5 ** ((latest - times[index]!) / (halfLife * DAY_MS)) : 1;
    total += weight;
    if (answer.isInStock) inStock += weight;
  });
  return Number((inStock / total).toFixed(2));
};

export const scoreFood = (food: CycleFood, answers: HistoryEntry[]) =>
  scoreOf(answers, halfLifeDays(cycleOf(food).days));

export const isFrequencyDays = (value: unknown): value is number => {
  const limits = rules().score?.frequencyDays ?? { min: 1, max: 365 };
  return typeof value === "number" && Number.isInteger(value) && value >= limits.min && value <= limits.max;
};
