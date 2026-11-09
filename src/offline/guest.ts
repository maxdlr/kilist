import type { CatalogPrize, CompletedRun, LocalState, PrizeEntry, Snapshot } from "./types";

export const GUEST_USER_ID = -1;
export const GUEST_LIST_ID = -1;

export const prizeEntries = (prizes: CatalogPrize[], current: PrizeEntry[] = []): PrizeEntry[] =>
  prizes.map((prize) => ({
    ...prize,
    kind: "skin",
    owned: prize.price === 0,
    wearable: prize.price === 0,
  }));

export const makeGuestSnapshot = (name: string, skin: string, prizes: CatalogPrize[] = []): Snapshot => ({
  user: {
    id: GUEST_USER_ID,
    username: name,
    email: "",
    type: "user",
    skin,
    language: null,
    household: { id: GUEST_USER_ID, joinCode: "" },
  },
  household: {
    id: GUEST_USER_ID,
    joinCode: "",
    members: [{ id: GUEST_USER_ID, username: name, type: "user" }],
  },
  mainList: { id: GUEST_LIST_ID, title: name, isMain: true },
  foods: [],
  frequencies: [],
  playedAt: [],
  openShopList: null,
  dashboard: {
    shopLists: { latest: { bought: 0, snoozed: 0 }, total: 0 },
    swipes: { latest: { swiped: 0 }, total: 0 },
  },
  prizes: { balance: 0, premium: false, prizes: prizeEntries(prizes) },
  recentSwipes: [],
});

export const hasLearnedAnything = (state: LocalState) =>
  state.foods.length > 0 || state.playedAt.length > 0 || state.prizes.balance > 0;

export const exportGuestState = (state: LocalState, importId: string) => {
  const runs: CompletedRun[] = [...state.runs];
  return {
    importId,
    sentAt: new Date().toISOString(),
    tzOffset: new Date().getTimezoneOffset(),
    foods: state.foods.map((food) => ({
      id: food.id,
      name: food.name,
      description: food.description,
      icon: food.icon ?? null,
      imageUrl: food.imageUrl ?? null,
      inStockScore: food.inStockScore,
      snoozedUntil: food.snoozedUntil ?? null,
      lastBoughtAt: food.lastBoughtAt ?? null,
      onList: food.lists.length > 0,
      histories: food.histories,
    })),
    frequencies: state.frequencies,
    playedAt: state.playedAt,
    runs,
    balance: state.prizes.balance,
    ownedPrizes: state.prizes.prizes
      .filter((prize) => prize.owned && prize.price > 0)
      .map((prize) => prize.id),
    recentSwipes: state.recentSwipes,
    skin: state.user.skin,
    language: state.user.language ?? null,
  };
};

export type GuestExport = ReturnType<typeof exportGuestState>;
