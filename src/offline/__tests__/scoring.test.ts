import { describe, expect, it } from "vitest";
import { rules, setRules } from "../rules";
import { cycleOf, isFrequencyDays, scoreFood } from "../scoring";
import type { HistoryEntry } from "../types";

const DAY_MS = 24 * 3600000;
const NOW = Date.parse("2026-06-01T12:00:00Z");
const ago = (days: number) => new Date(NOW - days * DAY_MS).toISOString();
const answer = (isInStock: boolean, daysAgo: number): HistoryEntry => ({ isInStock, at: ago(daysAgo) });

describe("scoreFood", () => {
  it("is full without any answer", () => {
    expect(scoreFood({}, [])).toBe(1);
  });

  it("does not let a long in-stock past bury a fresh run of outs", () => {
    const past = Array.from({ length: 60 }, (_, index) => answer(true, 3 + index * 7));
    const outs = [answer(false, 2), answer(false, 1), answer(false, 0)];

    expect(scoreFood({}, [...past, ...outs])).toBeLessThan(rules().shop.buyBelow!);
  });

  it("keeps a single stray answer from flipping a steady food to empty", () => {
    const steady = Array.from({ length: 5 }, (_, index) => answer(true, 1 + index));

    expect(scoreFood({}, [...steady, answer(false, 0)])).toBeGreaterThan(rules().shop.buyBelow!);
  });

  it("forgets old answers faster for a food bought every week than every month", () => {
    const answers = [answer(true, 6), answer(true, 4), answer(false, 0)];

    expect(scoreFood({ frequencyDays: 7 }, answers)).toBeLessThan(scoreFood({ frequencyDays: 30 }, answers));
  });

  it("falls back to a plain average when the server sends no score rules", () => {
    const { score: _score, ...older } = rules();
    setRules(older);

    expect(scoreFood({}, [answer(true, 30), answer(false, 0)])).toBe(0.5);
  });
});

describe("cycleOf", () => {
  it("uses a declared frequency as is", () => {
    expect(cycleOf({ frequencyDays: 7 })).toMatchObject({ days: 7, known: true });
  });

  it("falls back to the default cycle when nothing is known", () => {
    expect(cycleOf({})).toMatchObject({ days: 10, known: false });
  });
});

describe("isFrequencyDays", () => {
  it("accepts whole days in range only", () => {
    expect(isFrequencyDays(7)).toBe(true);
    expect([0, 1000, 2.5, "7", null].some(isFrequencyDays)).toBe(false);
  });
});
