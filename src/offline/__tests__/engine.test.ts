import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDb } from "../memoryDb";
import type { Snapshot } from "../types";

const memory = vi.hoisted(() => ({ db: null as any }));

vi.mock("../db", () => ({
  default: new Proxy({}, { get: (_target, key) => memory.db[key] }),
}));

const { applySyncResponse, enqueue, hasSession, pendingCount, resetStoreForTests } = await import("../store");
const { getSyncStatus, onSessionEnded, setSyncClient, signedOut, syncNow } = await import("../engine");

const snapshot = {
  user: { id: 7, username: "me", email: "me@x.y", type: "user", household: { id: 1, joinCode: "ABC" } },
  household: { id: 1, joinCode: "ABC", members: [] },
  mainList: { id: 1, title: "Main", isMain: true },
  foods: [{ id: 1, name: "Milk", inStockScore: 0.5, lists: [1], histories: [] }],
  frequencies: [],
  playedAt: [],
  openShopList: null,
  dashboard: {
    shopLists: { latest: { bought: 0, snoozed: 0 }, total: 0 },
    swipes: { latest: { swiped: 0 }, total: 0 },
  },
  prizes: { balance: 0, premium: true, prizes: [] },
  recentSwipes: [],
} as unknown as Snapshot;

const signIn = () =>
  applySyncResponse({ acks: [], ids: {}, retry: false, serverTime: "", hash: "h", snapshot });

const client = (post: (...args: any[]) => Promise<any>) => setSyncClient({ post } as any);

const offline = () => Promise.reject(new Error("Network Error"));

beforeEach(() => {
  memory.db = createMemoryDb();
  resetStoreForTests();
  signedOut();
  onSessionEnded(null);
});

describe("waiting to be back online", () => {
  it("never shows when a sync fails with nobody signed in", async () => {
    client(offline);

    await syncNow();

    expect(getSyncStatus().waiting).toBe(false);
  });

  it("shows when a signed-in sync can't reach the server, and keeps the queue", async () => {
    signIn();
    enqueue("swipe", { foodId: 1, isInStock: false });
    client(offline);

    await syncNow();

    expect(getSyncStatus()).toMatchObject({ waiting: true, pending: 1 });
    expect(pendingCount()).toBe(1);
  });

  it("clears once the queue gets through", async () => {
    signIn();
    const op = enqueue("swipe", { foodId: 1, isInStock: false });
    expect(op).toBeTruthy();
    client(offline);
    await syncNow();

    client(async (_url, body) => ({
      data: {
        acks: body.ops.map((entry: any) => ({ id: entry.id, status: "applied" })),
        ids: {},
        retry: false,
        serverTime: "",
      },
    }));
    await syncNow();

    expect(getSyncStatus()).toMatchObject({ waiting: false, pending: 0 });
  });

  it("stays waiting when the server errors, without logging out", async () => {
    signIn();
    const ended = vi.fn();
    onSessionEnded(ended);
    client(() => Promise.reject({ response: { status: 500 } }));

    await syncNow();

    expect(getSyncStatus().waiting).toBe(true);
    expect(ended).not.toHaveBeenCalled();
    expect(hasSession()).toBe(true);
  });

  it("ends the session on a real auth rejection, keeping the queue", async () => {
    signIn();
    enqueue("swipe", { foodId: 1, isInStock: false });
    const ended = vi.fn();
    onSessionEnded(ended);
    client(() => Promise.reject({ response: { status: 401 } }));

    await syncNow();

    expect(ended).toHaveBeenCalledOnce();
    expect(getSyncStatus().waiting).toBe(false);
    expect(pendingCount()).toBe(1);
  });
});
