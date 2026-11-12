export type Rules = {
  suggestions: { everyDays: number; retryDays: number; maxDeclines: number };
  swipe: {
    deckSize: number;
    eligibleBelow: number;
    restHours: number;
    staleDays: number;
    bigPackStaleDays: number;
    bigPackSize: number;
    historyLimit: number;
    onboardingScore: number;
  };
  tickets: {
    perSwipe: number;
    speedBonus: number;
    speedWindowMs: number;
    paidSwipesPerDay: number;
    payWindowHours: number;
  };
  shop: { snoozeHours: number; sameTripMinutes: number; suggestBelow: number };
  products: { maxBarcodes: number; quantityLength: number };
};

const SECTIONS = ["suggestions", "swipe", "tickets", "shop", "products"] as const;

let current: Rules | null = null;
const listeners = new Set<() => void>();

export const isRules = (value: unknown): value is Rules =>
  typeof value === "object" && value !== null && SECTIONS.every((section) => section in value);

export const setRules = (value: unknown) => {
  if (!isRules(value)) return;
  current = value;
  listeners.forEach((listener) => listener());
};

export const hasRules = () => current !== null;

export const rules = () => {
  if (!current) throw new Error("The rules pack is missing");
  return current;
};

export const subscribeRules = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const resetRulesForTests = () => {
  current = null;
};
