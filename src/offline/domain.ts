import type { FoodBankItemType } from "@/types/model";
import { foodKey, namesOf, normalizeName } from "./foodNames";
import { rules, type Rules } from "./rules";
import type { HistoryEntry, LocalFood, LocalShopList, LocalState, RaceAnswer, Reward } from "./types";

export { normalizeName };

const DAY_MS = 24 * 3600000;
const LEVELS = [0, 0.25, 0.5, 0.75, 1] as const;

const HOUR_MS = 3600000;

const time = (value?: string | null) => (value ? Date.parse(value) : 0);

export const toLocalDay = (date: Date | string, tzOffset: number) =>
  new Date(new Date(date).getTime() - tzOffset * 60000).toISOString().slice(0, 10);

export const calculateScore = (histories: HistoryEntry[]) => {
  if (histories.length === 0) return 1;
  const inStock = histories.filter((entry) => entry.isInStock).length;
  return Number((inStock / histories.length).toFixed(2));
};

export const addHistory = (food: LocalFood, entry: HistoryEntry, replace = false) => {
  if (time(food.lastBoughtAt) > time(entry.at)) return;
  const since = time(entry.at) - rules().swipe.restHours * HOUR_MS;
  const kept = replace
    ? food.histories.filter((past) => time(past.at) < since || time(past.at) > time(entry.at))
    : food.histories;
  food.histories = [...kept, entry]
    .sort((a, b) => time(a.at) - time(b.at))
    .slice(-rules().swipe.historyLimit);
  food.inStockScore = calculateScore(food.histories);
};

const UNITS: Record<string, number> = { kg: 1000, g: 1, l: 1000, cl: 10, ml: 1 };
const PACK = /(?:(\d+)\s*[x×]\s*)?(\d+(?:[.,]\d+)?)\s*(kg|g|l|cl|ml)\b/i;

export type ScannedProduct = { barcode?: string; icon?: string; quantity?: string };

export const packSize = (quantity?: string | null): number | null => {
  const match = quantity?.match(PACK);
  if (!match) return null;
  const count = match[1] ? Number(match[1]) : 1;
  return count * Number(match[2]!.replace(",", ".")) * UNITS[match[3]!.toLowerCase()]!;
};

export const staleDaysFor = (quantity?: string | null) => {
  const { bigPackSize, bigPackStaleDays, staleDays } = rules().swipe;
  return (packSize(quantity) ?? 0) >= bigPackSize ? bigPackStaleDays : staleDays;
};

export const addBoughtDate = (dates: string[] | undefined, at: string) => {
  const rhythm = rules().rhythm;
  if (!rhythm) return dates ?? [];
  const sorted = [...(dates ?? []), at].map(time).sort((a, b) => a - b);
  const kept: number[] = [];
  for (const date of sorted) {
    const previous = kept[kept.length - 1];
    if (previous !== undefined && date - previous < rhythm.sameBuyHours * HOUR_MS) continue;
    kept.push(date);
  }
  return kept.slice(-rhythm.keep).map((date) => new Date(date).toISOString());
};

export const buyGapDays = (dates?: string[]) => {
  const rhythm = rules().rhythm;
  const times = (dates ?? []).map(time).sort((a, b) => a - b);
  if (!rhythm || times.length < rhythm.minPurchases) return null;
  const gaps = times.slice(1).map((date, index) => date - times[index]!).sort((a, b) => a - b);
  const middle = Math.floor(gaps.length / 2);
  const median = gaps.length % 2 ? gaps[middle]! : (gaps[middle - 1]! + gaps[middle]!) / 2;
  return median / DAY_MS;
};

export const waitDaysFor = (food: Pick<LocalFood, "quantity" | "boughtDates">) => {
  const gap = buyGapDays(food.boughtDates);
  return gap === null
    ? staleDaysFor(food.quantity)
    : Math.max(rules().rhythm!.minDays, gap * rules().rhythm!.share);
};

export const isBarcode = (value: unknown): value is string =>
  typeof value === "string" && /^\d{8,14}$/.test(value);

export const attachProduct = (food: LocalFood, product?: ScannedProduct | null) => {
  if (!product || typeof product !== "object") return;
  const { maxBarcodes, quantityLength } = rules().products;
  const barcodes = food.barcodes ?? [];
  if (isBarcode(product.barcode) && !barcodes.includes(product.barcode)) {
    food.barcodes = [...barcodes, product.barcode].slice(-maxBarcodes);
  }
  if (typeof product.quantity === "string" && product.quantity.trim()) {
    food.quantity = product.quantity.trim().slice(0, quantityLength);
  }
  if (!food.icon && typeof product.icon === "string" && product.icon) food.icon = product.icon;
};

const lastActivity = (food: LocalFood) =>
  Math.max(time(food.lastBoughtAt), ...food.histories.map((entry) => time(entry.at)));

export const swipeDeck = (foods: LocalFood[], now: number) => {
  const { deckSize, eligibleBelow, restHours } = rules().swipe;
  const eligible = foods.filter(
    (food) =>
      food.lists.length > 0 && !food.histories.some((entry) => time(entry.at) >= now - restHours * HOUR_MS),
  );
  const low = eligible
    .filter((food) => food.inStockScore < eligibleBelow)
    .sort((a, b) => b.inStockScore - a.inStockScore);
  const stale = eligible
    .filter(
      (food) =>
        food.inStockScore >= eligibleBelow && lastActivity(food) < now - waitDaysFor(food) * DAY_MS,
    )
    .sort((a, b) => lastActivity(a) - lastActivity(b));
  return [...low, ...stale].slice(0, deckSize);
};

export const replayDeck = (foods: LocalFood[], now: number) => {
  const { deckSize, restHours } = rules().swipe;
  const since = now - restHours * HOUR_MS;
  const lastSwipe = (food: LocalFood) => Math.max(0, ...food.histories.map((entry) => time(entry.at)));
  return foods
    .filter((food) => food.lists.length > 0 && lastSwipe(food) >= since)
    .sort((a, b) => lastSwipe(a) - lastSwipe(b))
    .slice(0, deckSize);
};

export const shopCandidates = (foods: LocalFood[], now: number) =>
  foods.filter(
    (food) =>
      food.lists.length > 0 && food.inStockScore < 1 && time(food.snoozedUntil) < now,
  );

export const remainingShopFoods = (foods: LocalFood[], list: LocalShopList, now: number) => {
  const byId = new Map(foods.map((food) => [food.id, food]));
  return list.startFoodIds
    .filter((id) => !list.boughtFoodIds.includes(id))
    .map((id) => byId.get(id))
    .filter(
      (food): food is LocalFood =>
        food !== undefined && food.lists.length > 0 && time(food.snoozedUntil) < now,
    );
};

export const isShopListDone = (list: LocalShopList, foods: LocalFood[]) => {
  const listed = new Set(foods.filter((food) => food.lists.length > 0).map((food) => food.id));
  return list.startFoodIds
    .filter((id) => listed.has(id) || list.boughtFoodIds.includes(id))
    .every((id) => list.boughtFoodIds.includes(id));
};

export const nextFoods = (state: LocalState, foodId: number, list: LocalShopList | null, now: number) => {
  const byId = new Map(state.foods.map((food) => [food.id, food]));
  const { suggestBelow } = rules().shop;

  const canSuggest = (next: LocalFood) => {
    if (next.id === foodId || list?.boughtFoodIds.includes(next.id)) return false;
    if (time(next.snoozedUntil) >= now) return false;
    if (!list) return next.inStockScore !== 1;
    if (next.lists.length === 0) return false;
    return list.startFoodIds.includes(next.id) ? next.inStockScore !== 1 : next.inStockScore < suggestBelow;
  };

  return state.frequencies
    .filter((row) => {
      const next = byId.get(row.nextFoodId);
      return row.foodId === foodId && next !== undefined && canSuggest(next);
    })
    .sort((a, b) => b.count - a.count || a.nextFoodId - b.nextFoodId)
    .slice(0, 1)
    .map((row) => row.nextFoodId);
};

export const classifyScores = (foods: LocalFood[]) => {
  const summary: Record<number, number> = { 0: 0, 0.25: 0, 0.5: 0, 0.75: 0, 1: 0 };
  for (const food of foods) {
    const score = food.inStockScore || 0;
    const closest = LEVELS.reduce<number>(
      (prev, curr) => (Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev),
      LEVELS[0],
    );
    summary[closest]! += 1;
  }
  return summary;
};

export const swipeGame = (playedAt: string[], tzOffset: number, now: number) => {
  const days = new Set(playedAt.map((at) => toLocalDay(at, tzOffset)));
  const playedToday = days.has(toLocalDay(new Date(now), tzOffset));
  return { level: playedToday ? days.size : days.size + 1, playedToday };
};

export const awardSwipe = (state: LocalState, foodId: number, at: string): Reward => {
  const atMs = time(at);
  const balance = state.prizes.balance;
  const { perSwipe, speedBonus, speedWindowMs, paidSwipesPerDay, payWindowHours } = rules().tickets;
  const window = state.recentSwipes
    .filter((entry) => Math.abs(time(entry.at) - atMs) <= payWindowHours * HOUR_MS)
    .sort((a, b) => time(b.at) - time(a.at));

  if (window.some((entry) => entry.foodId === foodId) || window.length >= paidSwipesPerDay) {
    return { earned: 0, bonus: 0, balance };
  }

  const previous = window.find((entry) => time(entry.at) <= atMs);
  const bonus = previous && atMs - time(previous.at) < speedWindowMs ? speedBonus : 0;
  const earned = perSwipe + bonus;

  state.recentSwipes.push({ foodId, at });
  state.prizes.balance = balance + earned;
  return { earned, bonus, balance: state.prizes.balance };
};

export const verdictOf = (answers: RaceAnswer[]) => {
  const out = answers.filter((answer) => answer === "out").length;
  const inStock = answers.filter((answer) => answer === "in").length;
  if (out + inStock === 0) return null;
  return {
    result: out > inStock ? "needed" : inStock > out ? "stocked" : "tied",
    out,
    in: inStock,
  };
};

export const suggestionKey = (name: string) => normalizeName(name).slice(0, 255);

const fitsProfiles = (item: FoodBankItemType, profiles: string[]) =>
  !(item.tags ?? []).some((tag) => profiles.includes(tag)) &&
  (!item.group || profiles.includes(item.group));

export const starterFoods = (bank: FoodBankItemType[], profiles: string[]) =>
  bank.filter((item) => (item.staple || item.group) && fitsProfiles(item, profiles));

export const nextSuggestion = (
  state: LocalState,
  bank: FoodBankItemType[],
  limits: Rules["suggestions"] | undefined,
  tzOffset: number,
  now: number,
) => {
  if (!limits) return null;
  const today = toLocalDay(new Date(now), tzOffset);
  const days = new Set(state.playedAt.map((at) => toLocalDay(at, tzOffset)));
  days.add(today);
  if (days.size % limits.everyDays !== 0) return null;

  const month = Number(today.slice(5, 7));
  const known = new Set(state.foods.map((food) => foodKey(food.name)));
  const declined = state.household.declinedSuggestions ?? {};
  const profiles = state.household.eaterProfiles ?? [];

  return (
    bank.find((item) => {
      if (known.has(foodKey(item.name)) || !fitsProfiles(item, profiles)) return false;
      if (item.months && !item.months.includes(month)) return false;
      const refusals = namesOf(item.name)
        .map((name) => declined[suggestionKey(name)])
        .filter((refusal) => refusal !== undefined);
      if (refusals.length === 0) return true;
      const count = refusals.reduce((total, refusal) => total + refusal.count, 0);
      const last = Math.max(...refusals.map((refusal) => time(refusal.at)));
      return count < limits.maxDeclines && now - last >= limits.retryDays * DAY_MS;
    }) ?? null
  );
};
