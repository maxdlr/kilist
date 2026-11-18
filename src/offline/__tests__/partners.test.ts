import { describe, expect, it } from "vitest";
import { partnerAnswersToday } from "../domain";

const NOON = Date.parse("2026-11-18T11:00:00Z");
const PARIS = -60;
const members = [
  { id: 1, username: "Max" },
  { id: 2, username: "Sam" },
  { id: 3, username: "Alex" },
];

const at = (iso: string, isInStock: boolean | null, by?: number | null) => ({ at: iso, isInStock, by });

describe("partner answers", () => {
  it("shows what each partner answered today, latest answer wins", () => {
    const food = {
      histories: [
        at("2026-11-18T07:00:00Z", true, 2),
        at("2026-11-18T09:00:00Z", false, 2),
        at("2026-11-18T08:00:00Z", null, 3),
      ],
    };
    expect(partnerAnswersToday(food, members, 1, NOON, PARIS)).toEqual([
      { name: "Alex", isInStock: null },
      { name: "Sam", isInStock: false },
    ]);
  });

  it("ignores yesterday, my own answers, unsynced local answers and people who left", () => {
    const food = {
      histories: [
        at("2026-11-17T22:30:00Z", false, 2),
        at("2026-11-18T08:00:00Z", true, 1),
        at("2026-11-18T08:30:00Z", true),
        at("2026-11-18T09:00:00Z", true, 99),
      ],
    };
    expect(partnerAnswersToday(food, members, 1, NOON, PARIS)).toEqual([]);
  });

  it("uses the phone's day, so a late answer before local midnight still counts", () => {
    const food = { histories: [at("2026-11-17T23:30:00Z", true, 2)] };
    expect(partnerAnswersToday(food, members, 1, NOON, PARIS)).toEqual([{ name: "Sam", isInStock: true }]);
    expect(partnerAnswersToday(food, members, 1, NOON, 0)).toEqual([]);
  });
});
