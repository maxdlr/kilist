import type { FoodBankItemType } from "@/types/model";
import { foodKey, namesOf, normalizeName } from "./foodNames";
import { rules, type Rules } from "./rules";
import { buyGapDays, cycleOf, packSize, scoreFood, type CycleFood } from "./scoring";
import type { HistoryEntry, LocalFood, LocalShopList, LocalState, RaceAnswer, Reward } from "./types";

export { normalizeName, buyGapDays, packSize };

const DAY_MS = 24 * 3600000;
const LEVELS = [0, 0.25, 0.5, 0.75, 1] as const;

const HOUR_MS = 3600000;

const time = (value?: string | null) => (value ? Date.parse(value) : 0);

export const toLocalDay = (date: Date | string, tzOffset: number) =>
  new Date(new Date(date).getTime() - tzOffset * 60000).toISOString().slice(0, 10);

export const calculateScore = (histories: HistoryEntry[], food: CycleFood = {}) => scoreFood(food, histories);

export const addHistory = (food: LocalFood, entry: HistoryEntry, replace = false) => {
  if (time(food.lastBoughtAt) > time(entry.at)) return;
  const since = time(entry.at) - rules().swipe.restHours * HOUR_MS;
  const kept = replace
    ? food.histories.filter((past) => time(past.at) < since || time(past.at) > time(entry.at))
    : food.histories;
  food.histories = [...kept, entry]
    .sort((a, b) => time(a.at) - time(b.at))
    .slice(-rules().swipe.historyLimit);
  food.inStockScore = calculateScore(food.histories, food);
};

export type ScannedProduct = { barcode?: string; icon?: string; quantity?: string; aisle?: string };

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

export const waitDaysFor = (food: Pick<LocalFood, "quantity" | "boughtDates" | "frequencyDays">) => {
  const cycle = cycleOf(food);
  return cycle.known && cycle.days !== null && rules().rhythm
    ? Math.max(rules().rhythm!.minDays, cycle.days * rules().rhythm!.share)
    : staleDaysFor(food.quantity);
};

export const isBarcode = (value: unknown): value is string =>
  typeof value === "string" && /^\d{8,14}$/.test(value);

const cleanText = (value: unknown, max: number): string | null | undefined => {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim().slice(0, max) || null;
};

export const cleanNote = (value: unknown) => cleanText(value, rules().products.noteLength ?? 300);

export const cleanQuantity = (value: unknown) => cleanText(value, rules().products.quantityLength);

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
  if (!food.aisle && typeof product.aisle === "string" && product.aisle) food.aisle = product.aisle;
};

const lastActivity = (food: LocalFood) =>
  Math.max(time(food.lastBoughtAt), ...food.histories.map((entry) => time(entry.at)));

const payWindowMs = () => rules().tickets.payWindowHours * HOUR_MS;

export const isFirstGame = (state: Pick<LocalState, "swipedBefore" | "recentSwipes">, now: number) =>
  !state.swipedBefore && !state.recentSwipes.some((entry) => time(entry.at) < now - payWindowMs());

export const deckSizeFor = (state: Pick<LocalState, "swipedBefore" | "recentSwipes">, now: number) => {
  const { deckSize, firstDeckSize: first } = rules().swipe;
  return isFirstGame(state, now) && state.recentSwipes.length === 0 ? (first ?? deckSize) : deckSize;
};

export const swipeDeck = (
  foods: LocalFood[],
  now: number,
  { size = rules().swipe.deckSize, again = false }: { size?: number; again?: boolean } = {},
) => {
  const { eligibleBelow, restHours } = rules().swipe;
  const eligible = foods.filter(
    (food) =>
      food.lists.length > 0 && !food.histories.some((entry) => time(entry.at) >= now - restHours * HOUR_MS),
  );
  const isStale = (food: LocalFood) => lastActivity(food) < now - waitDaysFor(food) * DAY_MS;
  const low = eligible
    .filter((food) => food.inStockScore < eligibleBelow)
    .sort((a, b) => b.inStockScore - a.inStockScore);
  const stale = eligible
    .filter((food) => food.inStockScore >= eligibleBelow && isStale(food))
    .sort((a, b) => lastActivity(a) - lastActivity(b));
  const rest = again
    ? eligible
        .filter((food) => food.inStockScore >= eligibleBelow && !isStale(food))
        .sort((a, b) => lastActivity(a) - lastActivity(b))
    : [];
  return [...low, ...stale, ...rest].slice(0, size);
};

export const replayDeck = (foods: LocalFood[], now: number, ids: number[] = []) => {
  const { deckSize, restHours } = rules().swipe;
  const since = now - restHours * HOUR_MS;
  const listed = foods.filter((food) => food.lists.length > 0);
  if (ids.length > 0) {
    const byId = new Map(listed.map((food) => [food.id, food]));
    return ids.map((id) => byId.get(id)).filter((food): food is LocalFood => food !== undefined);
  }
  const lastSwipe = (food: LocalFood) => Math.max(0, ...food.histories.map((entry) => time(entry.at)));
  return listed
    .filter((food) => lastSwipe(food) >= since)
    .sort((a, b) => lastSwipe(b) - lastSwipe(a))
    .slice(0, deckSize)
    .reverse();
};

export const shopCandidates = (foods: LocalFood[], now: number) => {
  const buyBelow = rules().shop.buyBelow ?? 1;
  return foods.filter(
    (food) =>
      food.lists.length > 0 &&
      food.inStockScore < buyBelow &&
      time(food.snoozedUntil) < now,
  );
};

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

export const swipePay = (paidBefore: number, firstGame: boolean) => {
  const { deckSize, firstDeckSize: firstSize } = rules().swipe;
  const { perSwipe, speedBonus } = rules().tickets;
  const first = firstGame ? (firstSize ?? deckSize) : deckSize;
  const game = paidBefore < first ? 0 : 1 + Math.floor((paidBefore - first) / deckSize);
  const factor = 2 ** game;
  return { perSwipe: Math.floor(perSwipe / factor), speedBonus: Math.floor(speedBonus / factor) };
};

export const awardSwipe = (state: LocalState, foodId: number, at: string): Reward => {
  const atMs = time(at);
  const balance = state.prizes.balance;
  const { speedWindowMs } = rules().tickets;
  const window = state.recentSwipes
    .filter((entry) => Math.abs(time(entry.at) - atMs) <= payWindowMs())
    .sort((a, b) => time(b.at) - time(a.at));
  const pay = swipePay(window.length, isFirstGame(state, atMs));

  if (window.some((entry) => entry.foodId === foodId) || pay.perSwipe === 0) {
    return { earned: 0, bonus: 0, balance };
  }

  const previous = window.find((entry) => time(entry.at) <= atMs);
  const bonus = previous && atMs - time(previous.at) < speedWindowMs ? pay.speedBonus : 0;
  const earned = pay.perSwipe + bonus;

  state.recentSwipes.push({ foodId, at });
  state.prizes.balance = balance + earned;
  return { earned, bonus, balance: state.prizes.balance };
};

export const LEVEL_STEPS = 4;

export const setLevel = (food: LocalFood, level: number, at: string) => {
  if (time(food.lastBoughtAt) > time(at)) return;
  const inStock = Math.round(level * LEVEL_STEPS);
  const later = food.histories.filter((entry) => time(entry.at) > time(at));
  const reset = Array.from({ length: LEVEL_STEPS }, (_, step) => ({ isInStock: step < inStock, at }));
  food.histories = [...reset, ...later]
    .sort((a, b) => time(a.at) - time(b.at))
    .slice(-rules().swipe.historyLimit);
  food.inStockScore = calculateScore(food.histories, food);
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

export type PartnerAnswer = { name: string; isInStock: boolean | null };

export const partnerAnswersToday = (
  food: Pick<LocalFood, "histories">,
  members: { id: number; username: string }[],
  myId: number,
  now: number,
  tzOffset: number,
): PartnerAnswer[] => {
  const today = toLocalDay(new Date(now), tzOffset);
  const latest = new Map<number, HistoryEntry>();
  for (const entry of food.histories) {
    if (!entry.by || entry.by === myId || toLocalDay(entry.at, tzOffset) !== today) continue;
    const seen = latest.get(entry.by);
    if (!seen || time(entry.at) >= time(seen.at)) latest.set(entry.by, entry);
  }
  return members
    .filter((member) => latest.has(member.id))
    .map((member) => ({ name: member.username, isInStock: latest.get(member.id)!.isInStock }))
    .sort((a, b) => a.name.localeCompare(b.name));
};
