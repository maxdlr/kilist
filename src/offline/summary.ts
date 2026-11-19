import { rules } from "./rules";

const DAY_MS = 24 * 3600000;
const UNITS: Record<string, string> = { kg: "kg", g: "g", l: "L", cl: "cl", ml: "ml" };
const PACK = /^\s*(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|l|cl|ml)\s*$/i;
const SLOT = /\{(\w+)\}/g;

export type SummaryPart = { text: string; bold: boolean };

export type SummaryWords = {
  decimal: string;
  about: string;
  both: string;
  frequency: string;
  quantity: string;
  buckets: Record<string, string>;
};

export type SummaryFood = { boughtDates?: string[] | null; quantity?: string | null };

export type Rhythm = { gapDays: number; key: string; hedged: boolean } | { silent: string };

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
};

export const rhythmOf = (dates: string[] | null | undefined, now = Date.now()): Rhythm => {
  const summary = rules().summary;
  if (!summary) return { silent: "no rules" };
  const times = (dates ?? [])
    .map((date) => Date.parse(date))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (times.length < summary.minPurchases) return { silent: "too few purchases" };
  const gaps = times.slice(1).map((time, index) => (time - times[index]!) / DAY_MS);
  const gapDays = median(gaps);
  if (gapDays <= 0) return { silent: "no gap" };
  const spread = median(gaps.map((gap) => Math.abs(gap - gapDays))) / gapDays;
  if (spread > summary.maxSpread) return { silent: "uneven" };
  const sinceLast = (now - times[times.length - 1]!) / DAY_MS;
  if (sinceLast > Math.max(gapDays * summary.staleFactor, gapDays + summary.staleExtraDays)) {
    return { silent: "stale" };
  }
  const bucket = summary.buckets.find((entry) => gapDays <= entry.maxDays);
  if (!bucket) return { silent: "too rare" };
  return { gapDays, key: bucket.key, hedged: bucket.hedged };
};

export const formatQuantity = (quantity: string | null | undefined, decimal: string) => {
  const match = quantity?.match(PACK);
  if (!match) return null;
  const amount = match[2]!.replace(/[.,]/, decimal);
  const unit = UNITS[match[3]!.toLowerCase()]!;
  return `${match[1] ? `${match[1]} × ` : ""}${amount} ${unit}`;
};

const fill = (template: string, values: Record<string, string>): SummaryPart[] => {
  const parts: SummaryPart[] = [];
  let last = 0;
  for (const match of template.matchAll(SLOT)) {
    if (match.index! > last) parts.push({ text: template.slice(last, match.index), bold: false });
    parts.push({ text: values[match[1]!] ?? "", bold: true });
    last = match.index! + match[0].length;
  }
  if (last < template.length) parts.push({ text: template.slice(last), bold: false });
  return parts;
};

export const summarize = (food: SummaryFood, words: SummaryWords, now = Date.now()): SummaryPart[] | null => {
  const rhythm = rhythmOf(food.boughtDates, now);
  const phrase = "key" in rhythm ? words.buckets[rhythm.key] : undefined;
  const frequency = phrase && "key" in rhythm ? (rhythm.hedged ? phrase : words.about.replace("{f}", phrase)) : null;
  const quantity = formatQuantity(food.quantity, words.decimal);
  if (frequency && quantity) return fill(words.both, { f: frequency, q: quantity });
  if (frequency) return fill(words.frequency, { f: frequency });
  if (quantity) return fill(words.quantity, { q: quantity });
  return null;
};
