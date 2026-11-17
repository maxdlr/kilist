import { describe, expect, it } from "vitest";
import { checkPassword } from "../passwordRules";

const policy = { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 };

describe("checkPassword", () => {
  it("marks each rule as it is met", () => {
    const met = (value: string) =>
      Object.fromEntries(checkPassword(policy, value).map((rule) => [rule.id, rule.met]));
    expect(met("abc1")).toEqual({ length: false, upper: false, lower: true, number: true, symbol: false });
    expect(met("Abcdef1#")).toEqual({ length: true, upper: true, lower: true, number: true, symbol: true });
  });

  it("shows the minimum length and skips rules set to zero", () => {
    const rules = checkPassword({ ...policy, minLength: 10, minSymbols: 0 }, "");
    expect(rules.map((rule) => rule.id)).toEqual(["length", "upper", "lower", "number"]);
    expect(rules[0]!.glyph).toBe("10");
  });

  it("has no rules without a policy", () => {
    expect(checkPassword(undefined, "anything")).toEqual([]);
  });
});
