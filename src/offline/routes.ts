import {
  classifyScores,
  isShopListDone,
  nextSuggestion,
  remainingShopFoods,
  shopCandidates,
  swipeDeck,
  swipeGame,
  verdictOf,
  toLocalDay,
} from "./domain";
import { getLang } from "@/i18n";
import { getCatalog } from "./catalog";
import { foodKey, shownName } from "./foodNames";
import { resolveLocalId } from "./reducer";
import {
  allocateTempId,
  enqueue,
  getState,
  loadCached,
  loadValue,
  resolveAlias,
  saveValue,
} from "./store";
import type { LocalFood, LocalState, RaceAnswer } from "./types";

export const GHOST_RACE_ID = -1;
const GHOST_KEY = "ghostRace";

export type Request = {
  method: string;
  path: string;
  query: Record<string, any>;
  body: any;
};

const toFood = ({ histories: _histories, ...food }: LocalFood) => ({ ...food, name: shownName(food.name, getLang()) });

const state = () => getState() as LocalState;

const sameId = (a: number, b: number) => resolveLocalId(state(), resolveAlias(a)) === resolveLocalId(state(), resolveAlias(b));

const readShopList = (id: number) => {
  const now = Date.now();
  const { foods, openShopList: open } = state();
  if (!open || !sameId(open.id, id) || isShopListDone(open, foods)) {
    return { id, foods: [], startFoods: [], boughtFoods: [] };
  }
  const byId = (ids: number[]) =>
    foods.filter((food) => ids.includes(food.id)).map(toFood);
  return {
    id,
    foods: remainingShopFoods(foods, open, now).map(toFood),
    startFoods: byId(open.startFoodIds),
    boughtFoods: byId(open.boughtFoodIds),
  };
};

const startShopList = () => {
  const { foods, openShopList: open } = state();
  if (open) return open.id;
  const candidates = shopCandidates(foods, Date.now());
  if (candidates.length === 0) return null;
  const tempId = allocateTempId();
  enqueue("shop.start", { tempId, foodIds: candidates.map((food) => food.id) });
  return tempId;
};

const browseFoods = (query: Record<string, any>) => {
  const raw = query.listIds;
  const listIds: number[] | null = raw === undefined ? null : ([] as unknown[]).concat(raw).map(Number);
  const search = typeof query.search === "string" ? query.search.toLowerCase() : "";
  return state()
    .foods.filter(
      (food) =>
        (!listIds || food.lists.some((id) => listIds.includes(id))) &&
        (!search ||
          shownName(food.name, getLang()).toLowerCase().includes(search) ||
          (food.description ?? "").toLowerCase().includes(search)),
    )
    .sort((a, b) => a.inStockScore - b.inStockScore)
    .map(toFood);
};

const dashboard = () => {
  const { foods, dashboard: totals } = state();
  return {
    foods: { total: foods.length, scoreSummary: classifyScores(foods) },
    shopLists: totals.shopLists,
    swipes: totals.swipes,
  };
};

const readMainList = () => {
  const { mainList, foods } = state();
  if (!mainList) return undefined;
  return {
    ...mainList,
    foods: foods.filter((food) => food.lists.includes(mainList.id)).map(toFood),
  };
};

export const raceCacheKey = (tzOffset: unknown) => `/versus/race:${Number(tzOffset) || 0}`;

const ghostFoods = (day: string) => {
  const saved = loadValue<{ day: string; foodIds: number[] }>(GHOST_KEY);
  const { foods } = state();
  if (saved?.day === day) {
    return saved.foodIds
      .map((id) => foods.find((food) => food.id === resolveAlias(id)))
      .filter((food): food is LocalFood => food !== undefined);
  }
  const deck = swipeDeck(foods, Date.now());
  saveValue(GHOST_KEY, { day, foodIds: deck.map((food) => food.id) });
  return deck;
};

export const overlayRace = (raw: any) => {
  const lang = getLang();
  const view = {
    ...raw,
    foods: (raw.foods ?? []).map((food: { name: string }) => ({ ...food, name: shownName(food.name, lang) })),
  };
  const { user, raceAnswers } = state();
  const mine = raceAnswers.filter((answer) => answer.raceId === view.raceId);
  if (mine.length === 0) return view;

  const runs = [...(view.runs ?? [])];
  const index = runs.findIndex((run: any) => run.userId === user.id);
  const run =
    index >= 0
      ? { ...runs[index] }
      : { userId: user.id, username: user.username, answers: [], totalMs: null, finished: false };
  const answers = [...run.answers];
  for (const { foodId, answer, ms } of mine) {
    if (!answers.some((entry: any) => entry.foodId === foodId)) answers.push({ foodId, answer, ms });
  }
  run.answers = answers;
  if (answers.length >= view.foods.length) {
    run.finished = true;
    run.totalMs = answers.reduce((total: number, entry: any) => total + entry.ms, 0);
  }
  if (index >= 0) runs[index] = run;
  else runs.push(run);
  return { ...view, runs };
};

export const offlineRaceView = (tzOffset: unknown) => {
  const offset = Number(tzOffset) || 0;
  const day = toLocalDay(new Date(), offset);
  const cached = loadCached<any>(raceCacheKey(offset));
  if (cached?.day === day && cached.raceId) return overlayRace(cached);

  const foods = ghostFoods(day).map(toFood);
  const { household } = state();
  return overlayRace({
    day,
    level: cached?.level ?? 1,
    raceId: foods.length > 0 ? GHOST_RACE_ID : null,
    foods,
    members: cached?.members ?? household.members.map(({ id, username }) => ({ id, username })),
    runs: [],
    target: cached?.target?.kind === "best" ? cached.target : null,
    previousAnswers: cached?.previousAnswers ?? {},
  });
};

export const queueRaceAnswer = (raceId: number, body: { foodId: number; answer: RaceAnswer; ms: number }, tzOffset: number) => {
  const before = raceId < 0 ? offlineRaceView(tzOffset) : null;
  const reward = enqueue("race.answer", {
    raceId,
    foodId: body.foodId,
    answer: body.answer,
    ms: body.ms,
    ...(before && {
      day: before.day,
      foodIds: before.foods.map((food: { id: number }) => food.id),
    }),
  });
  const view = offlineRaceView(tzOffset);
  const { user } = state();
  const mates = (view.runs as any[])
    .filter((run) => run.userId !== user.id)
    .map((run) => ({
      userId: run.userId,
      username: run.username,
      vote: run.answers.find((entry: any) => entry.foodId === body.foodId),
    }))
    .filter((mate) => mate.vote)
    .map((mate) => ({
      userId: mate.userId,
      username: mate.username,
      answer: mate.vote.answer,
      ms: mate.vote.ms,
    }));
  const myRun = (view.runs as any[]).find((run) => run.userId === user.id);
  return {
    reward,
    finished: Boolean(myRun?.finished),
    totalMs: myRun?.totalMs ?? null,
    mates,
    verdict: verdictOf([body.answer, ...mates.map((mate) => mate.answer as RaceAnswer)]),
  };
};

type Handler = (request: Request, match: RegExpMatchArray) => any;

const LOCAL_ROUTES: [string, RegExp, Handler][] = [
  ["get", /^me$/, () => state().user],
  ["put", /^me\/skin$/, ({ body }) => enqueue("me.skin", { skin: body.skin })],
  ["put", /^me\/language$/, ({ body }) => enqueue("me.language", { language: body.language ?? null })],
  [
    "put",
    /^me\/notifications$/,
    ({ body }) => enqueue("me.notifications", { event: body.event, choice: body.choice }),
  ],
  ["get", /^households\/me$/, () => state().household],
  ["get", /^dashboard$/, dashboard],
  ["get", /^prizes$/, () => state().prizes],
  ["get", /^foods\/browse$/, ({ query }) => browseFoods(query)],
  ["get", /^foods\/swipe\/browse$/, () => swipeDeck(state().foods, Date.now()).map(toFood)],
  [
    "put",
    /^foods\/swipe\/edit\/(-?\d+)$/,
    ({ body }, match) => enqueue("swipe", { foodId: Number(match[1]), isInStock: body.isInStock }),
  ],
  [
    "post",
    /^foods\/create$/,
    ({ body }) => {
      if (!body.name) return undefined;
      const tempId = allocateTempId();
      return toFood(
        enqueue("food.create", {
          tempId,
          name: body.name,
          description: body.description,
          listId: body.listId,
          fromOnboarding: body.fromOnboarding === true,
          icon: typeof body.icon === "string" ? body.icon : undefined,
          ...(body.needed === true && { needed: true }),
          ...(body.product && typeof body.product === "object" && { product: body.product }),
        }),
      );
    },
  ],
  [
    "put",
    /^foods\/edit\/(-?\d+)$/,
    ({ body }, match) => {
      const food = enqueue("food.edit", {
        foodId: Number(match[1]),
        name: body.name,
        description: body.description,
      });
      return food ? toFood(food) : null;
    },
  ],
  [
    "put",
    /^lists\/(-?\d+)\/remove-foods$/,
    ({ body }, match) => {
      enqueue("food.remove", { listId: Number(match[1]), foodIds: body.foodIds });
      return readMainList();
    },
  ],
  ["get", /^lists\/read$/, ({ query }) => (query.main ? readMainList() : undefined)],
  [
    "get",
    /^swipe-list\/game$/,
    ({ query }) => swipeGame(state().playedAt, Number(query.tzOffset) || 0, Date.now()),
  ],
  [
    "post",
    /^swipe-list\/complete$/,
    ({ body }) => {
      const tzOffset = Number(body?.tzOffset) || 0;
      enqueue("swipe.complete", { tzOffset });
      return swipeGame(state().playedAt, tzOffset, Date.now());
    },
  ],
  ["post", /^shop-list\/start$/, startShopList],
  ["get", /^shop-list\/(-?\d+)$/, (_request, match) => readShopList(Number(match[1]))],
  [
    "put",
    /^shop-list\/edit\/(-?\d+)$/,
    ({ body }, match) =>
      enqueue(body.action === "buy" ? "shop.buy" : "shop.snooze", {
        shopListId: Number(match[1]),
        foodId: Number(body.foodId),
      }),
  ],
  [
    "post",
    /^shop-list\/clock\/(-?\d+)$/,
    (_request, match) => {
      enqueue("shop.clock", { shopListId: Number(match[1]) });
      return null;
    },
  ],
  [
    "post",
    /^shop-list\/cancel\/(-?\d+)$/,
    ({ body }, match) => {
      enqueue("shop.cancel", {
        shopListId: Number(match[1]),
        ...(body?.discard === true && { discard: true }),
      });
      return null;
    },
  ],
  ["get", /^shop-list\/open$/, () => state().openShopList?.id ?? null],
  [
    "get",
    /^shop-list\/preview$/,
    () =>
      shopCandidates(state().foods, Date.now())
        .sort((a, b) => a.inStockScore - b.inStockScore)
        .map(toFood),
  ],
  [
    "get",
    /^foods\/find$/,
    ({ query }) => {
      const name = String(query.name ?? "").trim();
      const barcode = String(query.barcode ?? "");
      const found = barcode
        ? state().foods.find((food) => food.lists.length > 0 && (food.barcodes ?? []).includes(barcode))
        : name
          ? state().foods.find((food) => foodKey(food.name) === foodKey(name))
          : undefined;
      return found ? { ...toFood(found), onList: found.lists.length > 0 } : null;
    },
  ],
  [
    "put",
    /^households\/profiles$/,
    ({ body }) => enqueue("household.profiles", { profiles: Array.isArray(body?.profiles) ? body.profiles : [] }),
  ],
  [
    "get",
    /^suggestions\/next$/,
    ({ query }) =>
      nextSuggestion(
        state(),
        getCatalog()?.foodBanks[getLang()] ?? [],
        getCatalog()?.rules?.suggestions,
        Number(query.tzOffset) || 0,
        Date.now(),
      ),
  ],
  [
    "post",
    /^suggestions\/decline$/,
    ({ body }) => {
      enqueue("suggestion.decline", { name: String(body?.name ?? "") });
      return null;
    },
  ],
];

const CACHED_READS = [
  /^versus\/(standings|me|shop|votes)$/,
  /^food-bank\/browse$/,
];

const ONLINE_ACTIONS = [
  /^logout$/,
  /^users\/delete$/,
  /^households\/switch$/,
  /^prizes\/[^/]+\/redeem$/,
];

export const matchLocal = ({ method, path }: Pick<Request, "method" | "path">) => {
  for (const [routeMethod, pattern, handler] of LOCAL_ROUTES) {
    const match = path.match(pattern);
    if (routeMethod === method && match) {
      return { handler, match };
    }
  }
  return null;
};

export class LocalError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

const GUEST_ROUTES: [string, RegExp, Handler][] = [
  ["put", /^me\/username$/, ({ body }) => enqueue("me.username", { username: body?.username ?? "" })],
  [
    "get",
    /^food-bank\/browse$/,
    () => {
      const onList = new Set(
        state()
          .foods.filter((food) => food.lists.length > 0)
          .map((food) => foodKey(food.name)),
      );
      const bank = getCatalog()?.foodBanks[getLang()];
      if (!bank) throw new LocalError(503, "catalog.missing");
      return bank.filter((item) => !onList.has(foodKey(item.name)));
    },
  ],
  [
    "post",
    /^prizes\/([^/]+)\/redeem$/,
    (_request, match) => {
      const prizeId = decodeURIComponent(match[1]!);
      if (state().prizes.prizes.find((prize) => prize.id === prizeId)?.accountOnly) {
        throw new LocalError(403, "prizes.accountOnly");
      }
      const counter = enqueue("prize.redeem", { prizeId });
      if (!counter) throw new LocalError(402, "prizes.notEnough");
      return counter;
    },
  ],
  [
    "put",
    /^me\/skin$/,
    ({ body }) => {
      const prize = state().prizes.prizes.find((entry) => entry.skin === body.skin);
      if (!prize?.wearable) throw new LocalError(403, "skins.locked");
      return enqueue("me.skin", { skin: body.skin });
    },
  ],
];

const GUEST_NETWORK = [/^login$/, /^signup$/, /^refresh$/, /^password\/(forgot|reset)$/, /^products\/\d+$/];

export const matchGuest = ({ method, path }: Pick<Request, "method" | "path">) => {
  for (const [routeMethod, pattern, handler] of GUEST_ROUTES) {
    const match = path.match(pattern);
    if (routeMethod === method && match) return { handler, match };
  }
  return null;
};

export const isGuestNetwork = ({ path }: Pick<Request, "path">) =>
  GUEST_NETWORK.some((pattern) => pattern.test(path));

export const isCachedRead = ({ method, path }: Pick<Request, "method" | "path">) =>
  method === "get" && CACHED_READS.some((pattern) => pattern.test(path));

export const isOnlineAction = ({ method, path }: Pick<Request, "method" | "path">) =>
  method !== "get" && ONLINE_ACTIONS.some((pattern) => pattern.test(path));

export const raceRead = ({ method, path }: Pick<Request, "method" | "path">) =>
  method === "get" && path === "versus/race";

export const raceAnswerMatch = ({ method, path }: Pick<Request, "method" | "path">) =>
  method === "post" ? path.match(/^versus\/race\/(-?\d+)\/answer$/) : null;

export const cacheKeyOf = (path: string, query: Record<string, unknown>) =>
  `${path}?${JSON.stringify(query)}`;
