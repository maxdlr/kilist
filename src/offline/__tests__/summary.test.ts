import { describe, expect, it } from "vitest";
import en from "@/i18n/common/en";
import fr from "@/i18n/common/fr";
import { formatQuantity, rhythmOf, summarize, type SummaryPart } from "../summary";

const DAY_MS = 24 * 3600000;
const NOW = Date.parse("2026-06-01T12:00:00Z");
const daysAgo = (...days: number[]) => days.map((day) => new Date(NOW - day * DAY_MS).toISOString());
const text = (parts: SummaryPart[] | null) => parts?.map((part) => (part.bold ? `**${part.text}**` : part.text)).join("") ?? null;
const say = (food: Parameters<typeof summarize>[0], words = en.summary) => text(summarize(food, words, NOW));

describe("summarize", () => {
  it("says nothing about a new item", () => {
    expect(say({})).toBeNull();
  });

  it("says nothing after a single purchase", () => {
    expect(say({ boughtDates: daysAgo(4) })).toBeNull();
  });

  it("crunches four purchases this month into about once a week", () => {
    expect(say({ boughtDates: daysAgo(1, 8, 15, 22) })).toBe("Bought **about once a week**.");
  });

  it("adds a parsable quantity", () => {
    expect(say({ boughtDates: daysAgo(1, 8, 15, 22), quantity: "1L" })).toBe("Bought **about once a week**, usually **1 L**.");
  });

  it("keeps the quantity alone when purchases are irregular", () => {
    expect(say({ boughtDates: daysAgo(1, 3, 25, 27, 60), quantity: "500 g" })).toBe("Usually bought in **500 g**.");
  });

  it("drops a habit that stopped", () => {
    expect(say({ boughtDates: daysAgo(60, 67, 74, 81) })).toBeNull();
  });

  it("ignores a free-text quantity", () => {
    expect(say({ boughtDates: daysAgo(1, 3, 5, 7), quantity: "a big one" })).toBe("Bought **about every other day**.");
  });

  it("stays silent about very rare items", () => {
    expect(say({ boughtDates: daysAgo(5, 190, 375), quantity: "2 kg" })).toBe("Usually bought in **2 kg**.");
  });

  it("does not add about to words that already hedge", () => {
    expect(say({ boughtDates: daysAgo(0, 1, 2, 3, 4, 5, 6, 7), quantity: "1,5 l" })).toBe(
      "Bought **almost every day**, usually **1.5 L**.",
    );
  });

  it("speaks French without gender agreement", () => {
    expect(say({ boughtDates: daysAgo(1, 8, 15, 22), quantity: "6x1.5L" }, fr.summary)).toBe(
      "Achat **environ une fois par semaine**, en général en **6 × 1,5 L**.",
    );
    expect(say({ quantity: "500 g" }, fr.summary)).toBe("En général en **500 g**.");
  });
});

describe("rhythmOf", () => {
  it("explains why it stays silent", () => {
    expect(rhythmOf(daysAgo(4), NOW)).toEqual({ silent: "too few purchases" });
    expect(rhythmOf(daysAgo(1, 3, 25, 27, 60), NOW)).toEqual({ silent: "uneven" });
    expect(rhythmOf(daysAgo(60, 67, 74, 81), NOW)).toEqual({ silent: "stale" });
    expect(rhythmOf(daysAgo(5, 190, 375), NOW)).toEqual({ silent: "too rare" });
  });

  it("ignores broken dates", () => {
    expect(rhythmOf(["nope", ...daysAgo(1, 8, 15)], NOW)).toMatchObject({ key: "weekly" });
  });
});

describe("formatQuantity", () => {
  it("normalizes units and multipacks", () => {
    expect(formatQuantity("6x1L", ".")).toBe("6 × 1 L");
    expect(formatQuantity("250G", ".")).toBe("250 g");
    expect(formatQuantity("1.5 kg", ",")).toBe("1,5 kg");
  });

  it("refuses anything it cannot read whole", () => {
    expect(formatQuantity("about 2 kg", ".")).toBeNull();
    expect(formatQuantity("", ".")).toBeNull();
    expect(formatQuantity(null, ".")).toBeNull();
  });
});
