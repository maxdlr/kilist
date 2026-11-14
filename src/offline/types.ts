import type { Rules } from "./rules";
import type { AisleType, EaterProfileType, FoodBankItemType, HouseholdWithMembersType, ListType, UserType } from "@/types/model";

export type HistoryEntry = { isInStock: boolean | null; at: string };

export type LocalFood = {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  icon?: string | null;
  barcodes?: string[];
  quantity?: string | null;
  aisle?: string | null;
  inStockScore: number;
  snoozedUntil?: string | null;
  lastBoughtAt?: string | null;
  boughtDates?: string[];
  lists: number[];
  histories: HistoryEntry[];
};

export type LocalShopList = {
  id: number;
  startFoodIds: number[];
  boughtFoodIds: number[];
  buyLog: { foodId: number; at: string }[];
  startedAt: string | null;
  createdAt?: string | null;
};

export type CompletedRun = Omit<LocalShopList, "id"> & { endedAt: string };

export type DashboardTotals = {
  shopLists: {
    latest: { date?: string; bought: number; snoozed: number };
    total: number;
  };
  swipes: {
    latest: { date?: string; swiped: number };
    total: number;
  };
};

export type CatalogPrize = { id: string; kind: "skin"; skin: string; price: number; accountOnly?: boolean };

export type NotificationChoice = "none" | "email" | "push" | "both";

export type NotificationEvent = {
  id: string;
  channels: ("email" | "push")[];
  default: NotificationChoice;
  guestDefault: NotificationChoice;
};

export type Catalog = {
  foodBanks: Record<string, FoodBankItemType[]>;
  foodNames?: Record<string, Record<string, string[]>>;
  aisles?: AisleType[];
  profiles?: EaterProfileType[];
  prizes: CatalogPrize[];
  rules?: Rules;
  notifications?: { events: NotificationEvent[]; alwaysEmail: string[] };
};

export type PrizeEntry = {
  id: string;
  kind: "skin";
  skin: string;
  price: number;
  accountOnly?: boolean;
  owned: boolean;
  wearable: boolean;
};

export type Prizes = {
  balance: number;
  reserved?: number;
  premium: boolean;
  prizes: PrizeEntry[];
};

export type Snapshot = {
  user: UserType;
  household: HouseholdWithMembersType;
  mainList: Pick<ListType, "id" | "title" | "description"> & { isMain: boolean } | null;
  foods: LocalFood[];
  frequencies: { foodId: number; nextFoodId: number; count: number }[];
  playedAt: string[];
  openShopList: LocalShopList | null;
  dashboard: DashboardTotals;
  prizes: Prizes;
  recentSwipes: { foodId: number | null; at: string }[];
};

export type RaceAnswer = "in" | "out" | "up";

export type LocalState = Snapshot & {
  raceAnswers: { raceId: number; foodId: number; answer: RaceAnswer; ms: number }[];
  localAliases: Record<string, number>;
  runs: CompletedRun[];
};

export type OpType =
  | "swipe"
  | "swipe.complete"
  | "race.answer"
  | "shop.start"
  | "shop.clock"
  | "shop.buy"
  | "shop.snooze"
  | "shop.cancel"
  | "food.create"
  | "food.edit"
  | "food.remove"
  | "me.skin"
  | "me.language"
  | "me.username"
  | "prize.redeem"
  | "me.notifications"
  | "household.profiles"
  | "suggestion.decline";

export type Op = {
  id: string;
  type: OpType;
  at: string;
  payload: Record<string, any>;
  attempts: number;
};

export type Reward = { earned: number; bonus: number; balance: number | null };

export type SyncAck = { id: string; status: "applied" | "rejected" };

export type SyncResponse = {
  acks: SyncAck[];
  ids: Record<string, number>;
  retry: boolean;
  serverTime: string;
  hash?: string;
  snapshot?: Snapshot;
};
