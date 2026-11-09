import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDb } from "../memoryDb";

const memory = vi.hoisted(() => ({ db: null as any }));

vi.mock("../db", () => ({
  default: new Proxy({}, { get: (_target, key) => memory.db[key] }),
}));

const store = await import("../store");
const stats = await import("../stats");
const { matchGuest, matchLocal } = await import("../routes");
const { GUEST_LIST_ID, makeGuestSnapshot } = await import("../guest");

const call = (method: string, path: string, body: unknown = {}) => {
  const request = { method, path, query: {}, body };
  const route = matchGuest(request) ?? matchLocal(request);
  return route!.handler(request, route!.match);
};

const sent = () => {
  const post = vi.fn(async () => ({ data: { saved: 1 } }));
  return { post, client: { post } as any };
};

beforeEach(() => {
  memory.db = createMemoryDb();
  store.resetStoreForTests();
  store.startGuest(makeGuestSnapshot("Guest", "arcade", []));
});

const today = () => memory.db.loadValue("keep:statsDays")?.at(-1);

describe("anonymous stats", () => {
  it("counts cards, rounds, runs and taken suggestions from real actions", () => {
    const milk = call("post", "foods/create", { name: "Milk", listId: GUEST_LIST_ID });
    const eggs = call("post", "foods/create", { name: "Eggs", listId: GUEST_LIST_ID });
    call("put", `foods/swipe/edit/${milk.id}`, { isInStock: false });
    call("put", `foods/swipe/edit/${eggs.id}`, { isInStock: false });
    call("post", "swipe-list/complete", { tzOffset: 0 });
    call("post", "swipe-list/complete", { tzOffset: 0 });

    store.getState()!.frequencies.push({ foodId: milk.id, nextFoodId: eggs.id, count: 3 });
    const run = call("post", "shop-list/start");
    call("put", `shop-list/edit/${run}`, { action: "buy", foodId: milk.id });
    call("put", `shop-list/edit/${run}`, { action: "buy", foodId: eggs.id });

    expect(today()).toMatchObject({ cards: 2, rounds: 1, runs: 1, suggestionsTaken: 1, foods: 2, guest: true, skin: "arcade" });
  });

  it("keeps the install id and pending days across logout", async () => {
    stats.countStat("rounds");
    const { post, client } = sent();
    store.wipe();
    await stats.sendStats(client);
    const firstId = (post.mock.calls[0] as any[])[1].installId;

    stats.countStat("rounds");
    await stats.sendStats(client);

    expect((post.mock.calls[1] as any[])[1].installId).toBe(firstId);
  });

  it("sends no names, ids or food details", async () => {
    call("post", "foods/create", { name: "Insulin", listId: GUEST_LIST_ID });
    stats.markActive();
    const { post, client } = sent();

    await stats.sendStats(client);

    const body = JSON.stringify((post.mock.calls[0] as any[])[1]);
    expect(body).not.toContain("Insulin");
    expect(body).not.toContain("Guest");
    expect(Object.keys((post.mock.calls[0] as any[])[1])).toEqual(["installId", "days"]);
  });

  it("keeps unsent days when offline", async () => {
    stats.countStat("rounds");
    const post = vi.fn(async () => {
      throw new Error("Network Error");
    });

    await stats.sendStats({ post } as any);

    expect(memory.db.loadValue("keep:statsDays")).toHaveLength(1);
  });

  it("credits a signup to a recent account gate", () => {
    stats.countGate("household");
    stats.countSignup();

    expect(today()).toMatchObject({ gatesHousehold: 1, signups: 1, signupsAfterGate: 1 });
  });
});
