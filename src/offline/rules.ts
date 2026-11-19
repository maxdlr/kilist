export type PasswordPolicy = {
  minLength: number;
  minLowercase: number;
  minUppercase: number;
  minNumbers: number;
  minSymbols: number;
};

export type Rules = {
  suggestions: { everyDays: number; retryDays: number; maxDeclines: number };
  swipe: {
    deckSize: number;
    firstDeckSize?: number;
    eligibleBelow: number;
    restHours: number;
    staleDays: number;
    bigPackStaleDays: number;
    bigPackSize: number;
    historyLimit: number;
    onboardingScore: number;
  };
  score?: {
    defaultCycleDays: number;
    bigPackCycleDays: number;
    halfLifeShare: number;
    minHalfLifeDays: number;
    trust: { declared: number; perPurchaseGap: number; pack: number; fallback: number };
    frequencyDays: { min: number; max: number };
  };
  rhythm?: { minPurchases: number; keep: number; share: number; minDays: number; sameBuyHours: number };
  tickets: {
    perSwipe: number;
    speedBonus: number;
    speedWindowMs: number;
    paidSwipesPerDay: number;
    payWindowHours: number;
  };
  shop: { snoozeHours: number; sameTripMinutes: number; suggestBelow: number; buyBelow?: number };
  products: { maxBarcodes: number; quantityLength: number; noteLength?: number };
  summary?: {
    minPurchases: number;
    maxSpread: number;
    staleFactor: number;
    staleExtraDays: number;
    buckets: { maxDays: number; key: string; hedged: boolean }[];
  };
  accounts?: {
    usernameMin: number;
    usernameMax: number;
    password?: PasswordPolicy;
  };
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
