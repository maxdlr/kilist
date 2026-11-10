import { describe, expect, it } from "vitest";
import { reminderDates } from "../reminder";

const at = (day: number, hour: number) => new Date(2026, 10, day, hour, 0, 0, 0);

describe("daily reminder", () => {
  it("starts today when today's round isn't played yet", () => {
    const dates = reminderDates(at(10, 9), []);
    expect(dates).toHaveLength(7);
    expect(dates[0]).toEqual(at(10, 18));
    expect(dates[6]).toEqual(at(16, 18));
  });

  it("skips today once today's round is played", () => {
    const dates = reminderDates(at(10, 9), [at(10, 8).toISOString()]);
    expect(dates[0]).toEqual(at(11, 18));
    expect(dates).toHaveLength(7);
  });

  it("skips today when the reminder time has passed", () => {
    expect(reminderDates(at(10, 19), [])[0]).toEqual(at(11, 18));
  });

  it("ignores rounds played on other days", () => {
    expect(reminderDates(at(10, 9), [at(9, 20).toISOString()])[0]).toEqual(at(10, 18));
  });
});
