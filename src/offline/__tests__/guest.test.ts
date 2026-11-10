import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDb } from "../memoryDb";

const memory = vi.hoisted(() => ({ db: null as any }));

vi.mock("../db", () => ({
  default: new Proxy({}, { get: (_target, key) => memory.db[key] }),
}));

const store = await import("../store");
const { matchGuest, matchLocal } = await import("../routes");
const { GUEST_LIST_ID, makeGuestSnapshot } = await import("../guest");
const catalog = await import("../catalog");

const PRIZES = [
  { id: "skin:arcade", kind: "skin" as const, skin: "arcade", price: 0 },
  { id: "skin:roast", kind: "skin" as const, skin: "roast", price: 1000 },
  { id: "skin:versus", kind: "skin" as const, skin: "versus", price: 1000, accountOnly: true },
];

const call = (method: string, path: string, body: unknown = {}, query: Record<string, unknown> = {}) => {
  const request = { method, path, query, body };
  const route = matchGuest(request) ?? matchLocal(request);
  if (!route) throw new Error(`No route for ${method} ${path}`);
  return route.handler(request, route.match);
};

const start = (prizes = PRIZES) => store.startGuest(makeGuestSnapshot("Guest", "arcade", prizes));

beforeEach(() => {
  memory.db = createMemoryDb();
  store.resetStoreForTests();
  catalog.resetCatalogForTests();
});

describe("guest mode", () => {
  it("works without any server state and never queues for sync", () => {
    start();

    const food = call("post", "foods/create", { name: "Milk", listId: GUEST_LIST_ID });
    call("put", `foods/swipe/edit/${food.id}`, { isInStock: false });

    expect(store.isGuest()).toBe(true);
    expect(store.hasSession()).toBe(false);
    expect(store.pendingCount()).toBe(0);
    expect(store.getState()!.foods[0]!.histories).toHaveLength(1);
  });

  it("survives a restart with everything it learned", () => {
    start();
    const food = call("post", "foods/create", { name: "Milk", listId: GUEST_LIST_ID });
    call("put", `foods/swipe/edit/${food.id}`, { isInStock: false });

    store.resetStoreForTests();

    expect(store.isGuest()).toBe(true);
    expect(store.getState()!.foods[0]!.name).toBe("Milk");
    expect(store.getState()!.prizes.balance).toBe(10);
  });

  it("keeps finished shop runs for the signup upload", () => {
    start();
    const milk = call("post", "foods/create", { name: "Milk", listId: GUEST_LIST_ID });
    const id = call("post", "shop-list/start");
    expect(id).toBeNull();
    call("put", `foods/swipe/edit/${milk.id}`, { isInStock: false });

    const runId = call("post", "shop-list/start");
    call("put", `shop-list/edit/${runId}`, { action: "buy", foodId: milk.id });

    const exported = store.exportGuest()!;
    expect(exported.runs).toHaveLength(1);
    expect(exported.runs[0]!.boughtFoodIds).toEqual([milk.id]);
    expect(exported.runs[0]!.endedAt).toBeTruthy();
  });

  it("exports foods, history, rounds and tickets under a stable id", () => {
    start();
    const milk = call("post", "foods/create", { name: "Milk", listId: GUEST_LIST_ID });
    call("put", `foods/swipe/edit/${milk.id}`, { isInStock: false });
    call("post", "swipe-list/complete", { tzOffset: 0 });
    call("put", `lists/${GUEST_LIST_ID}/remove-foods`, { foodIds: [milk.id] });

    const first = store.exportGuest()!;
    const again = store.exportGuest()!;

    expect(again.importId).toBe(first.importId);
    expect(first.foods[0]).toMatchObject({ name: "Milk", onList: false });
    expect(first.foods[0]!.histories).toHaveLength(1);
    expect(first.playedAt).toHaveLength(1);
    expect(first.balance).toBe(10);
    expect(store.hasGuestData()).toBe(true);
  });

  it("serves the downloaded food bank, minus foods already listed", () => {
    start();
    expect(() => call("get", "food-bank/browse")).toThrow();

    memory.db.saveValue("catalog", {
      foodBanks: { en: [{ name: "Milk", icon: "milk" }, { name: "Eggs", icon: "eggs" }], fr: [] },
      prizes: PRIZES,
    });
    catalog.resetCatalogForTests();
    call("post", "foods/create", { name: "milk", listId: GUEST_LIST_ID });

    expect(call("get", "food-bank/browse").map((item: any) => item.name)).toEqual(["Eggs"]);
  });

  it("keeps the food bank's icon for onboarding picks", () => {
    start();

    const food = call("post", "foods/create", {
      name: "Milk",
      listId: GUEST_LIST_ID,
      fromOnboarding: true,
      icon: "milk",
    });

    expect(food.icon).toBe("milk");
    expect(food.inStockScore).toBe(0.5);
  });

  it("unlocks a skin locally once enough tickets are earned", () => {
    start();
    expect(() => call("post", "prizes/skin:roast/redeem")).toThrow();
    expect(() => call("put", "me/skin", { skin: "roast" })).toThrow();

    store.getState()!.prizes.balance = 1200;
    const counter = call("post", "prizes/skin:roast/redeem");

    expect(counter.balance).toBe(200);
    expect(call("put", "me/skin", { skin: "roast" }).skin).toBe("roast");
    expect(store.exportGuest()!.ownedPrizes).toEqual(["skin:roast"]);
  });

  it("never sells Versus to a guest, whatever the balance", () => {
    start();
    store.getState()!.prizes.balance = 5000;

    expect(() => call("post", "prizes/skin:versus/redeem")).toThrow();
    expect(() => call("put", "me/skin", { skin: "versus" })).toThrow();
    expect(store.getState()!.prizes.balance).toBe(5000);
  });

  it("keeps a bought skin when the catalogue refreshes", () => {
    start();
    store.getState()!.prizes.balance = 1000;
    call("post", "prizes/skin:roast/redeem");

    store.applyCatalog({ foodBanks: {}, prizes: PRIZES });

    expect(store.getState()!.prizes.prizes.find((prize) => prize.id === "skin:roast")?.owned).toBe(true);
  });

  it("fills in prizes when the catalogue arrives after the guest started", () => {
    start([]);
    expect(store.getState()!.prizes.prizes).toEqual([]);

    store.applyCatalog({ foodBanks: {}, prizes: PRIZES });

    expect(store.getState()!.prizes.prizes.map((prize) => prize.id)).toEqual(["skin:arcade", "skin:roast", "skin:versus"]);
  });

  it("asks for the intro once", () => {
    start();
    expect(store.isIntroPending()).toBe(true);
    store.consumeIntro();
    expect(store.isIntroPending()).toBe(false);
  });

  it("is fully cleared when leaving guest mode", () => {
    start();
    call("post", "foods/create", { name: "Milk", listId: GUEST_LIST_ID });

    store.wipe();
    store.resetStoreForTests();

    expect(store.isGuest()).toBe(false);
    expect(store.getState()).toBeNull();
  });
});
