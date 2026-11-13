import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDb } from "../memoryDb";
import type { Snapshot, SyncResponse } from "../types";

const memory = vi.hoisted(() => ({ db: null as any }));

vi.mock("../db", () => ({
  default: new Proxy({}, { get: (_target, key) => memory.db[key] }),
}));

const { applySyncResponse, getState, hasSession, pendingCount, pendingOps, resetStoreForTests, resolveAlias } =
  await import("../store");
const { GHOST_RACE_ID, matchLocal, offlineRaceView, queueRaceAnswer } = await import("../routes");
const { calculateScore, nextSuggestion, starterFoods, swipeDeck, swipeGame } = await import("../domain");
const { setFoodBanks, shownName } = await import("../foodNames");

const food = (id: number, score = 0.5, extra = {}) => ({
  id,
  name: `Food ${id}`,
  inStockScore: score,
  lists: [1],
  histories: [],
  ...extra,
});

const snapshot = (overrides: Partial<Snapshot> = {}): Snapshot =>
  ({
    user: { id: 7, username: "me", email: "me@x.y", type: "user", household: { id: 1, joinCode: "ABC" } },
    household: { id: 1, joinCode: "ABC", members: [{ id: 7, username: "me", type: "user" }] },
    mainList: { id: 1, title: "Main", isMain: true },
    foods: [food(1), food(2), food(3, 0.25)],
    frequencies: [],
    playedAt: [],
    openShopList: null,
    dashboard: {
      shopLists: { latest: { bought: 0, snoozed: 0 }, total: 0 },
      swipes: { latest: { swiped: 0 }, total: 0 },
    },
    prizes: { balance: 100, premium: true, prizes: [] },
    recentSwipes: [],
    ...overrides,
  }) as Snapshot;

const pull = (partial: Partial<SyncResponse> = {}, base: Snapshot | null = snapshot()) =>
  applySyncResponse({
    acks: [],
    ids: {},
    retry: false,
    serverTime: new Date().toISOString(),
    hash: "h",
    ...(base && { snapshot: base }),
    ...partial,
  });

const call = (method: string, path: string, body: unknown = {}, query: Record<string, unknown> = {}) => {
  const request = { method, path, query, body };
  const local = matchLocal(request);
  if (!local) throw new Error(`No local route for ${method} ${path}`);
  return local.handler(request, local.match);
};

beforeEach(() => {
  memory.db = createMemoryDb();
  resetStoreForTests();
});

describe("session", () => {
  it("has no session until a snapshot has been pulled", () => {
    expect(hasSession()).toBe(false);
    pull();
    expect(hasSession()).toBe(true);
    expect(call("get", "me").id).toBe(7);
  });

  it("survives an app restart with its queue", () => {
    pull();
    call("put", "foods/swipe/edit/1", { isInStock: false });

    resetStoreForTests();

    expect(hasSession()).toBe(true);
    expect(pendingCount()).toBe(1);
    expect(getState()!.foods[0]!.histories).toHaveLength(1);
    expect(getState()!.prizes.balance).toBe(110);
  });
});

describe("the swipe game offline", () => {
  it("removes a swiped food from today's deck and recalculates its score", () => {
    pull();

    call("put", "foods/swipe/edit/1", { isInStock: true });

    expect(call("get", "foods/swipe/browse").map((entry: any) => entry.id)).toEqual([2, 3]);
    expect(getState()!.foods[0]!.inStockScore).toBe(1);
  });

  it("does not offer foods swiped in the last 24 hours or well stocked ones", () => {
    const now = Date.now();
    const deck = swipeDeck(
      [
        food(1, 0.5, { histories: [{ isInStock: true, at: new Date(now - 3600000).toISOString() }] }),
        food(2, 0.9, { lastBoughtAt: new Date(now - 3600000).toISOString() }),
        food(6, 1, { lastBoughtAt: new Date(now - 8 * 24 * 3600000).toISOString() }),
        food(3, 0.5, { lists: [] }),
        food(4, 0.25),
        food(5, 0.5),
      ],
      now,
    );
    expect(deck.map((entry) => entry.id)).toEqual([5, 4, 6]);
  });

  it("matches the server's score rules", () => {
    expect(calculateScore([])).toBe(1);
    expect(
      calculateScore([
        { isInStock: true, at: "" },
        { isInStock: false, at: "" },
        { isInStock: null, at: "" },
      ]),
    ).toBe(0.33);
  });

  it("pays tickets once per food, up to ten a day", () => {
    pull(
      {},
      snapshot({
        foods: Array.from({ length: 12 }, (_, index) => food(index + 1)),
        recentSwipes: Array.from({ length: 9 }, (_, index) => ({
          foodId: 100 + index,
          at: new Date(Date.now() - 3600000).toISOString(),
        })),
      }),
    );

    expect(call("put", "foods/swipe/edit/1", { isInStock: false }).earned).toBe(10);
    expect(call("put", "foods/swipe/edit/2", { isInStock: false }).earned).toBe(0);
  });

  it("marks the household's day as played and levels up", () => {
    pull();
    const tzOffset = 0;

    expect(call("get", "swipe-list/game", {}, { tzOffset })).toEqual({ level: 1, playedToday: false });
    expect(call("post", "swipe-list/complete", { tzOffset })).toEqual({ level: 1, playedToday: true });
    expect(swipeGame(getState()!.playedAt, tzOffset, Date.now() + 24 * 3600000)).toEqual({
      level: 2,
      playedToday: false,
    });
  });
});

describe("shopping offline", () => {
  const start = () => call("post", "shop-list/start");

  it("starts a run with a temporary id and lists what's needed", () => {
    pull();

    const id = start();

    expect(id).toBeLessThan(0);
    expect(call("get", `shop-list/${id}`).foods.map((entry: any) => entry.id).sort()).toEqual([1, 2, 3]);
  });

  it("reuses the household's open run", () => {
    pull(
      {},
      snapshot({
        openShopList: { id: 44, startFoodIds: [1], boughtFoodIds: [], buyLog: [], startedAt: null },
      }),
    );

    expect(start()).toBe(44);
    expect(pendingCount()).toBe(0);
  });

  it("buying resets the food and suggests the usual next one", () => {
    pull(
      {},
      snapshot({
        foods: [
          food(1, 0.5, { histories: [{ isInStock: false, at: "2020-01-01T00:00:00.000Z" }] }),
          food(2),
          food(3),
        ],
        frequencies: [
          { foodId: 1, nextFoodId: 2, count: 1 },
          { foodId: 1, nextFoodId: 3, count: 4 },
        ],
      }),
    );
    const id = start();

    expect(call("put", `shop-list/edit/${id}`, { action: "buy", foodId: 1 })).toEqual([3]);
    expect(getState()!.foods[0]!.inStockScore).toBe(1);
    expect(call("get", `shop-list/${id}`).foods.map((entry: any) => entry.id).sort()).toEqual([2, 3]);
  });

  it("suggests a needed food that is not on this shop list, and adds it", () => {
    pull(
      {},
      snapshot({
        foods: [food(1, 0.5), food(2, 1), food(3, 1)],
        frequencies: [
          { foodId: 1, nextFoodId: 2, count: 3 },
          { foodId: 1, nextFoodId: 3, count: 1 },
        ],
      }),
    );
    const id = start();
    const foods = getState()!.foods;
    foods.find((entry) => entry.id === 2)!.inStockScore = 0.75;
    foods.find((entry) => entry.id === 3)!.inStockScore = 0.5;

    expect(call("put", `shop-list/edit/${id}`, { action: "buy", foodId: 1 })).toEqual([3]);
    expect(call("get", `shop-list/${id}`).foods.map((entry: any) => entry.id)).toEqual([3]);
  });

  it("learns the store order while offline", () => {
    pull();
    const id = start();

    call("put", `shop-list/edit/${id}`, { action: "buy", foodId: 1 });
    call("put", `shop-list/edit/${id}`, { action: "buy", foodId: 2 });

    expect(getState()!.frequencies).toEqual([{ foodId: 1, nextFoodId: 2, count: 1 }]);
  });

  it("hides a snoozed food", () => {
    pull();
    const id = start();

    call("put", `shop-list/edit/${id}`, { action: "snooze", foodId: 1 });

    expect(call("get", `shop-list/${id}`).foods.map((entry: any) => entry.id).sort()).toEqual([2, 3]);
  });

  it("closes the run when everything is bought and updates the dashboard", () => {
    pull({}, snapshot({ foods: [food(1)] }));
    const id = start();

    call("put", `shop-list/edit/${id}`, { action: "buy", foodId: 1 });

    expect(call("get", `shop-list/${id}`).foods).toEqual([]);
    expect(getState()!.openShopList).toBeNull();
    expect(call("get", "dashboard").shopLists.total).toBe(1);
  });

  it("keeps reading a run after its temporary id is replaced", () => {
    pull();
    const id = start();
    const startOp = pendingOps()[0]!;

    pull(
      { acks: [{ id: startOp.id, status: "applied" }], ids: { [String(id)]: 44 } },
      snapshot({
        openShopList: { id: 44, startFoodIds: [1, 2, 3], boughtFoodIds: [], buyLog: [], startedAt: null },
      }),
    );

    expect(resolveAlias(id)).toBe(44);
    expect(call("get", `shop-list/${id}`).foods).toHaveLength(3);
    call("put", `shop-list/edit/${id}`, { action: "buy", foodId: 1 });
    expect(pendingOps()[0]!.payload.shopListId).toBe(44);
  });

  it("merges into a housemate's run that appeared while its start was still queued", () => {
    pull();
    const id = start();
    call("put", `shop-list/edit/${id}`, { action: "buy", foodId: 1 });

    pull(
      {},
      snapshot({
        openShopList: { id: 44, startFoodIds: [2], boughtFoodIds: [], buyLog: [], startedAt: null },
      }),
    );

    expect(getState()!.openShopList!.id).toBe(44);
    expect(getState()!.openShopList!.boughtFoodIds).toEqual([1]);
  });
});

describe("the inventory offline", () => {
  it("keeps a scanned product on the food and finds it again by barcode", () => {
    pull();
    const product = { barcode: "3017620422003", quantity: "1 kg", icon: "pasta" };

    call("post", "foods/create", { name: "Spread", listId: 1, product });
    call("post", "foods/create", { name: "spread", listId: 1, product: { barcode: "8076800195057", icon: "rice" } });

    expect(call("get", "foods/find", {}, { name: "Spread" })).toMatchObject({ barcodes: ["3017620422003", "8076800195057"], quantity: "1 kg", icon: "pasta" });
    expect(pendingOps()[0]!.payload.product).toEqual(product);
    expect(call("get", "foods/find", {}, { barcode: "8076800195057" }).name).toBe("Spread");
    expect(call("get", "foods/find", {}, { barcode: "00000000" })).toBeNull();
  });

  it("waits longer before asking again about a big pack", async () => {
    const { packSize, staleDaysFor } = await import("../domain");
    const now = Date.now();
    const bought = new Date(now - 8 * 24 * 3600000).toISOString();
    const small = food(1, 1, { lastBoughtAt: bought, quantity: "250 g" });
    const big = food(2, 1, { lastBoughtAt: bought, quantity: "6 x 33 cl" });

    expect(packSize("6 x 33 cl")).toBe(1980);
    expect(staleDaysFor("1,5 L")).toBe(10);
    expect(swipeDeck([small, big], now).map((entry) => entry.id)).toEqual([1]);
  });

  it("asks again sooner about a food that is bought often", async () => {
    const { addBoughtDate, buyGapDays, waitDaysFor } = await import("../domain");
    const now = Date.now();
    const daysAgo = (days: number) => new Date(now - days * 24 * 3600000).toISOString();
    const milk = { ...food(1, 1), lastBoughtAt: daysAgo(4), boughtDates: [daysAgo(16), daysAgo(10), daysAgo(4)] };
    const rice = { ...food(2, 1), lastBoughtAt: daysAgo(20), boughtDates: [daysAgo(140), daysAgo(80), daysAgo(20)] };
    const twice = { ...food(3, 1), lastBoughtAt: daysAgo(4), boughtDates: [daysAgo(10), daysAgo(4)] };

    expect(buyGapDays(milk.boughtDates)).toBe(6);
    expect(waitDaysFor(milk)).toBe(3);
    expect(waitDaysFor(rice)).toBe(30);
    expect(waitDaysFor(twice)).toBe(7);
    expect(waitDaysFor({ boughtDates: [daysAgo(2), daysAgo(1), daysAgo(0)] })).toBe(2);
    expect(buyGapDays([daysAgo(100), daysAgo(12), daysAgo(6), daysAgo(0)])).toBe(6);
    expect(swipeDeck([milk, rice, twice], now).map((entry) => entry.id)).toEqual([1]);

    const sameDay = addBoughtDate([daysAgo(6)], new Date(now - 6 * 24 * 3600000 + 3600000).toISOString());
    expect(sameDay).toHaveLength(1);
    const many = Array.from({ length: 12 }, (_, index) => daysAgo(index)).reduce<string[]>(addBoughtDate, []);
    expect(many).toHaveLength(8);
    expect(many[7]).toBe(daysAgo(0));
  });

  it("adds a food under a temporary id and swaps it after sync", () => {
    pull();

    const created = call("post", "foods/create", { name: "Oat milk", listId: 1 });
    expect(created.id).toBeLessThan(0);
    expect(call("get", "foods/browse", {}, { listIds: [1], search: "oat" })).toHaveLength(1);

    const [op] = pendingOps();
    pull(
      { acks: [{ id: op!.id, status: "applied" }], ids: { [String(created.id)]: 50 } },
      snapshot({ foods: [food(1), food(50, 1, { name: "Oat milk" })] }),
    );

    call("put", `foods/edit/${created.id}`, { name: "Oat" });
    expect(pendingOps()[0]!.payload.foodId).toBe(50);
    expect(getState()!.foods.find((entry) => entry.id === 50)!.name).toBe("Oat");
  });

  it("rewrites queued operations that use the temporary id", () => {
    pull();
    const created = call("post", "foods/create", { name: "Oat milk", listId: 1 });
    call("put", `foods/edit/${created.id}`, { name: "Oat" });
    const [create] = pendingOps();

    pull({ acks: [{ id: create!.id, status: "applied" }], ids: { [String(created.id)]: 50 } }, null);

    expect(pendingOps()[0]!.payload.foodId).toBe(50);
  });

  it("merges a food with the same name", () => {
    pull();

    const created = call("post", "foods/create", { name: " food 1 ", listId: 1 });

    expect(created.id).toBe(1);
    expect(getState()!.foods).toHaveLength(3);
  });

  it("removes a food from the list but keeps it in the household", () => {
    pull();

    call("put", "lists/1/remove-foods", { foodIds: [1] });

    expect(call("get", "lists/read", {}, { main: "true" }).foods.map((entry: any) => entry.id)).toEqual([2, 3]);
    expect(getState()!.foods).toHaveLength(3);
  });
});

describe("syncing back", () => {
  it("keeps actions made during a sync on top of the new snapshot", () => {
    pull();
    call("put", "foods/swipe/edit/1", { isInStock: false });
    const [first] = pendingOps();
    call("put", "foods/swipe/edit/2", { isInStock: false });

    pull(
      { acks: [{ id: first!.id, status: "applied" }] },
      snapshot({
        foods: [food(1, 0, { histories: [{ isInStock: false, at: new Date().toISOString() }] }), food(2)],
        prizes: { balance: 110, premium: true, prizes: [] },
      }),
    );

    expect(pendingCount()).toBe(1);
    expect(getState()!.foods[1]!.histories).toHaveLength(1);
    expect(getState()!.prizes.balance).toBe(120);
  });

  it("undoes a rejected action", () => {
    pull();
    call("put", "foods/edit/1", { name: "Renamed" });
    const [op] = pendingOps();

    pull({ acks: [{ id: op!.id, status: "rejected" }] });

    expect(pendingCount()).toBe(0);
    expect(getState()!.foods[0]!.name).toBe("Food 1");
  });

  it("shows a housemate's purchase after pulling", () => {
    pull({}, snapshot({ foods: [food(1, 0.2)] }));

    pull({}, snapshot({ foods: [food(1, 1, { lastBoughtAt: new Date().toISOString() })] }));

    expect(call("get", "foods/browse", {}, {})[0].inStockScore).toBe(1);
  });

  it("gives up on an operation the server keeps failing", () => {
    pull();
    call("put", "foods/edit/1", { name: "Poison" });

    for (let attempt = 0; attempt < 4; attempt += 1) pull({ retry: true }, null);
    expect(pendingCount()).toBe(1);

    pull({ retry: true }, null);
    expect(pendingCount()).toBe(0);
  });
});

describe("Versus offline", () => {
  it("builds a ghost race with a stable deck for the day", () => {
    pull();

    const first = offlineRaceView(0);
    expect(first.raceId).toBe(GHOST_RACE_ID);
    expect(first.foods).toHaveLength(3);

    queueRaceAnswer(first.raceId, { foodId: first.foods[0].id, answer: "out", ms: 800 }, 0);

    const second = offlineRaceView(0);
    expect(second.foods.map((entry: any) => entry.id)).toEqual(first.foods.map((entry: any) => entry.id));
    expect(second.runs[0].answers).toHaveLength(1);
  });

  it("sends its day and deck so the server can make it the real race", () => {
    pull();
    const view = offlineRaceView(0);

    queueRaceAnswer(view.raceId, { foodId: view.foods[0].id, answer: "out", ms: 800 }, 0);

    expect(pendingOps()[0]!.payload).toMatchObject({
      raceId: GHOST_RACE_ID,
      day: view.day,
      foodIds: view.foods.map((entry: any) => entry.id),
    });
  });

  it("finishes a ghost race and pays provisional tickets", () => {
    pull();
    const view = offlineRaceView(0);
    let result: any;
    for (const entry of view.foods) {
      result = queueRaceAnswer(view.raceId, { foodId: entry.id, answer: "in", ms: 1000 }, 0);
    }

    expect(result.finished).toBe(true);
    expect(result.totalMs).toBe(3000);
    expect(result.reward.earned).toBeGreaterThan(0);
    expect(offlineRaceView(0).runs[0].finished).toBe(true);
  });
});

describe("inventory without maintenance", () => {
  beforeEach(() => {
    memory.db = createMemoryDb();
    resetStoreForTests();
    pull();
  });

  it("adds a typed food as needed", () => {
    const created = call("post", "foods/create", { name: "Oat milk", listId: 1, needed: true });

    expect(getState()!.foods.find((entry) => entry.id === created.id)!.inStockScore).toBe(0);
  });

  it("does not count a discarded shop", () => {
    const id = call("post", "shop-list/start");
    call("put", `shop-list/edit/${id}`, { action: "buy", foodId: 3 });
    call("post", `shop-list/cancel/${id}`, { discard: true });

    expect(getState()!.openShopList).toBeNull();
    expect(getState()!.dashboard.shopLists.total).toBe(0);
    expect(getState()!.runs).toHaveLength(0);
  });

  it("previews the shop without opening it", () => {
    const preview = call("get", "shop-list/preview");

    expect(preview.map((entry: { id: number }) => entry.id)).toEqual([3, 1, 2]);
    expect(getState()!.openShopList).toBeNull();
  });
});

describe("replay", () => {
  it("replaces today's answers instead of adding to them, without paying twice", () => {
    applySyncResponse({ acks: [], ids: {}, retry: false, serverTime: "", snapshot: snapshot({ foods: [food(1), food(2)] as any }) });
    call("put", "foods/swipe/edit/1", { isInStock: false });
    const balance = getState()!.prizes.balance;

    expect(call("get", "foods/swipe/browse").map((entry: { id: number }) => entry.id)).toEqual([2]);
    expect(call("get", "foods/swipe/browse", {}, { replay: 1 }).map((entry: { id: number }) => entry.id)).toEqual([1]);

    call("put", "foods/swipe/edit/1", { isInStock: true, replay: true });

    const replayed = getState()!.foods.find((entry) => entry.id === 1)!;
    expect(replayed.histories).toHaveLength(1);
    expect(replayed.histories[0]!.isInStock).toBe(true);
    expect(getState()!.prizes.balance).toBe(balance);

    call("put", "foods/swipe/edit/2", { isInStock: true, replay: true });
    expect(getState()!.prizes.balance).toBe(balance);
  });
});

describe("rules pack", () => {
  it("waits for the pack before replaying queued actions", async () => {
    const { resetRulesForTests, setRules, rules } = await import("../rules");
    const { applyCatalog } = await import("../store");
    const pack = rules();
    applySyncResponse({ acks: [], ids: {}, retry: false, serverTime: "", snapshot: snapshot({ foods: [food(1)] as any }) });
    call("put", "foods/swipe/edit/1", { isInStock: false });

    resetRulesForTests();
    resetStoreForTests();
    expect(getState()!.foods[0]!.histories).toHaveLength(0);
    expect(pendingCount()).toBe(1);

    applyCatalog({ foodBanks: {}, prizes: [], rules: pack });
    expect(getState()!.foods[0]!.histories).toHaveLength(1);
    setRules(pack);
  });
});

describe("eater profiles and suggestions", () => {
  const bank = [
    { name: "Milk", staple: true, tags: ["dairy"] },
    { name: "Rice", staple: true },
    { name: "Cat food", group: "cat" },
    { name: "Salmon", tags: ["fish"] },
    { name: "Tofu" },
  ];
  const today = new Date("2026-11-10T12:00:00Z").getTime();
  const rules = { everyDays: 2, retryDays: 30, maxDeclines: 2 };

  it("picks staples and the groups that apply, minus exclusions", () => {
    expect(starterFoods(bank, ["dairy", "cat"]).map((item) => item.name)).toEqual(["Rice", "Cat food"]);
  });

  const stateWith = (playedAt: string[], declined = {}) =>
    ({
      ...snapshot({ playedAt }),
      household: { id: 1, joinCode: "", members: [], eaterProfiles: ["fish"], declinedSuggestions: declined },
      foods: [food(1, 0.5, { name: "Rice" })],
    }) as any;

  it("suggests every other day, skipping known and excluded foods", () => {
    expect(nextSuggestion(stateWith([]), bank, rules, 0, today)).toBeNull();
    expect(nextSuggestion(stateWith(["2026-11-09T10:00:00Z"]), bank, rules, 0, today)?.name).toBe("Milk");
    expect(nextSuggestion(stateWith(["2026-11-09T10:00:00Z"]), bank, undefined, 0, today)).toBeNull();
  });

  it("leaves out foods that are out of season", () => {
    const played = ["2026-11-09T10:00:00Z"];
    const seasonal = [{ name: "Lettuce", months: [5, 6, 7] }, { name: "Oranges", months: [11, 12, 1] }];

    expect(nextSuggestion(stateWith(played), seasonal, rules, 0, today)?.name).toBe("Oranges");
  });

  it("knows a food by any of its names", () => {
    const en = [{ key: "pasta", name: "Pasta" }];
    const fr = [{ key: "pasta", name: "Pâtes" }];
    setFoodBanks({ en, fr });
    const played = ["2026-11-09T10:00:00Z"];
    const owned = { ...stateWith(played), foods: [food(1, 0.5, { name: "pasta" })] } as any;
    const declinedTwice = { pasta: { at: "2026-09-01T00:00:00Z", count: 1 }, "pâtes": { at: "2026-09-02T00:00:00Z", count: 1 } };

    expect(shownName("pasta", "fr")).toBe("Pâtes");
    expect(shownName("Quinoa", "fr")).toBe("Quinoa");
    expect(nextSuggestion(owned, fr, rules, 0, today)).toBeNull();
    expect(nextSuggestion(stateWith(played, declinedTwice), fr, rules, 0, today)).toBeNull();
    setFoodBanks(null);
  });

  it("offers a declined food once more after a month", () => {
    const played = ["2026-11-09T10:00:00Z"];
    const recent = { milk: { at: "2026-11-01T00:00:00Z", count: 1 } };
    const old = { milk: { at: "2026-09-01T00:00:00Z", count: 1 } };
    const twice = { milk: { at: "2026-09-01T00:00:00Z", count: 2 } };

    expect(nextSuggestion(stateWith(played, recent), bank, rules, 0, today)?.name).toBe("Tofu");
    expect(nextSuggestion(stateWith(played, old), bank, rules, 0, today)?.name).toBe("Milk");
    expect(nextSuggestion(stateWith(played, twice), bank, rules, 0, today)?.name).toBe("Tofu");
  });
});
