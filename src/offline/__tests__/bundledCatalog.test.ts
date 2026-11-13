import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDb } from "../memoryDb";

const memory = vi.hoisted(() => ({ db: null as any }));
const RULES = vi.hoisted(() => ({
  suggestions: {},
  swipe: { deckSize: 10 },
  tickets: {},
  shop: {},
  products: {},
}));

vi.mock("../db", () => ({
  default: new Proxy({}, { get: (_target, key) => memory.db[key] }),
}));
vi.mock("../bundledCatalog.json", () => ({
  default: { foodBanks: { en: [] }, prizes: [], rules: RULES },
}));

const store = await import("../store");
const catalog = await import("../catalog");
const { hasRules, resetRulesForTests, rules } = await import("../rules");

beforeEach(() => {
  memory.db = createMemoryDb();
  store.resetStoreForTests();
  catalog.resetCatalogForTests();
  resetRulesForTests();
});

describe("the pack shipped inside the app", () => {
  it("is used on a first start with nothing downloaded", () => {
    expect(hasRules()).toBe(false);

    store.hasSession();

    expect(hasRules()).toBe(true);
    expect(catalog.getCatalog()?.foodBanks).toEqual({ en: [] });
  });

  it("gives way to a downloaded pack", () => {
    memory.db.saveValue("catalog", {
      foodBanks: { en: [] },
      prizes: [],
      rules: { ...RULES, swipe: { deckSize: 12 } },
    });

    store.hasSession();

    expect(rules().swipe.deckSize).toBe(12);
    expect(catalog.getCatalog()?.rules?.swipe.deckSize).toBe(12);
  });
});
