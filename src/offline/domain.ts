import type { FoodBankItemType } from "@/types/model";
import type { HistoryEntry, LocalFood, LocalShopList, LocalState, RaceAnswer, Reward } from "./types";

const DAY_MS = 24 * 3600000;
const HISTORY_LIMIT = 8;
const LEVELS = [0, 0.25, 0.5, 0.75, 1] as const;

export const SWIPE_DECK_SIZE = 10;
export const SWIPE_ELIGIBLE_BELOW = 0.75;
export const SWIPE_TICKETS = 10;
export const SPEED_BONUS_TICKETS = 5;
export const SPEED_WINDOW_MS = 2000;
export const PAID_SWIPES_PER_DAY = 10;
export const SNOOZE_MS = DAY_MS;
export const SAME_TRIP_MS = 30 * 60 * 1000;

const time = (value?: string | null) => (value ? Date.parse(value) : 0);

export const normalizeName = (name: string) => name.trim().toLowerCase();

export const toLocalDay = (date: Date | string, tzOffset: number) =>
  new Date(new Date(date).getTime() - tzOffset * 60000).toISOString().slice(0, 10);

export const calculateScore = (histories: HistoryEntry[]) => {
  if (histories.length === 0) return 1;
  const inStock = histories.filter((entry) => entry.isInStock).length;
  return Number((inStock / histories.length).toFixed(2));
};

export const addHistory = (food: LocalFood, entry: HistoryEntry) => {
  if (time(food.lastBoughtAt) > time(entry.at)) return;
  food.histories = [...food.histories, entry]
    .sort((a, b) => time(a.at) - time(b.at))
    .slice(-HISTORY_LIMIT);
  food.inStockScore = calculateScore(food.histories);
};

export const STALE_DAYS = 7;

const lastActivity = (food: LocalFood) =>
  Math.max(time(food.lastBoughtAt), ...food.histories.map((entry) => time(entry.at)));

export const swipeDeck = (foods: LocalFood[], now: number) => {
  const eligible = foods.filter(
    (food) => food.lists.length > 0 && !food.histories.some((entry) => time(entry.at) >= now - DAY_MS),
  );
  const low = eligible
    .filter((food) => food.inStockScore < SWIPE_ELIGIBLE_BELOW)
    .sort((a, b) => b.inStockScore - a.inStockScore);
  const stale = eligible
    .filter(
      (food) =>
        food.inStockScore >= SWIPE_ELIGIBLE_BELOW && lastActivity(food) < now - STALE_DAYS * DAY_MS,
    )
    .sort((a, b) => lastActivity(a) - lastActivity(b));
  return [...low, ...stale].slice(0, SWIPE_DECK_SIZE);
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
  const available = list
    ? list.startFoodIds.filter(
        (id) => id !== foodId && !list.boughtFoodIds.includes(id) && (byId.get(id)?.lists.length ?? 0) > 0,
      )
    : null;
  if (available && available.length === 0) return [];

  return state.frequencies
    .filter((row) => {
      const next = byId.get(row.nextFoodId);
      return (
        row.foodId === foodId &&
        next !== undefined &&
        next.inStockScore !== 1 &&
        time(next.snoozedUntil) < now &&
        (!available || available.includes(row.nextFoodId))
      );
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
  const window = state.recentSwipes
    .filter((entry) => Math.abs(time(entry.at) - atMs) <= DAY_MS)
    .sort((a, b) => time(b.at) - time(a.at));

  if (window.some((entry) => entry.foodId === foodId) || window.length >= PAID_SWIPES_PER_DAY) {
    return { earned: 0, bonus: 0, balance };
  }

  const previous = window.find((entry) => time(entry.at) <= atMs);
  const bonus = previous && atMs - time(previous.at) < SPEED_WINDOW_MS ? SPEED_BONUS_TICKETS : 0;
  const earned = SWIPE_TICKETS + bonus;

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

export const SUGGESTION_EVERY_DAYS = 2;
export const SUGGESTION_RETRY_MS = 30 * DAY_MS;
export const SUGGESTION_MAX_DECLINES = 2;

export const suggestionKey = (name: string) => normalizeName(name).slice(0, 255);

const fitsProfiles = (item: FoodBankItemType, profiles: string[]) =>
  !(item.tags ?? []).some((tag) => profiles.includes(tag)) &&
  (!item.group || profiles.includes(item.group));

export const starterFoods = (bank: FoodBankItemType[], profiles: string[]) =>
  bank.filter((item) => (item.staple || item.group) && fitsProfiles(item, profiles));

export const nextSuggestion = (
  state: LocalState,
  bank: FoodBankItemType[],
  tzOffset: number,
  now: number,
) => {
  const days = new Set(state.playedAt.map((at) => toLocalDay(at, tzOffset)));
  days.add(toLocalDay(new Date(now), tzOffset));
  if (days.size % SUGGESTION_EVERY_DAYS !== 0) return null;

  const known = new Set(state.foods.map((food) => normalizeName(food.name)));
  const declined = state.household.declinedSuggestions ?? {};
  const profiles = state.household.eaterProfiles ?? [];

  return (
    bank.find((item) => {
      if (known.has(normalizeName(item.name)) || !fitsProfiles(item, profiles)) return false;
      const refusal = declined[suggestionKey(item.name)];
      if (!refusal) return true;
      return refusal.count < SUGGESTION_MAX_DECLINES && now - time(refusal.at) >= SUGGESTION_RETRY_MS;
    }) ?? null
  );
};
