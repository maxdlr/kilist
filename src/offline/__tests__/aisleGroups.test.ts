import { describe, expect, it } from "vitest";
import en from "@/i18n/common/en";
import { groupSmallAisles, type AisleSection } from "../aisleGroups";
import { setRules, rules } from "../rules";

const aisle = (id: string, count: number): AisleSection<string> => ({
  id,
  label: id,
  foods: Array.from({ length: count }, (_, index) => `${id}${index + 1}`),
});

const shape = (sections: AisleSection<string>[]) =>
  groupSmallAisles(sections, en.aisleFamilies).map((section) => `${section.label}:${section.foods.length}`);

describe("groupSmallAisles", () => {
  it("merges small aisles of the same family under the family name", () => {
    expect(shape([aisle("produce", 4), aisle("meat", 1), aisle("fish", 2), aisle("dairy", 3)])).toEqual([
      "produce:4",
      "Fresh market:3",
      "dairy:3",
    ]);
  });

  it("never lets a big aisle absorb a small one", () => {
    expect(shape([aisle("produce", 4), aisle("meat", 1)])).toEqual(["produce:4", "meat:1"]);
  });

  it("counts an aisle of three items as small", () => {
    expect(shape([aisle("dairy", 3), aisle("frozen", 1)])).toEqual(["Chilled & frozen:4"]);
  });

  it("leaves a small aisle alone when its family has no other small aisle", () => {
    expect(shape([aisle("household", 1), aisle("pantry", 2)])).toEqual(["household:1", "pantry:2"]);
  });

  it("never mixes families", () => {
    expect(shape([aisle("bakery", 1), aisle("dairy", 1), aisle("frozen", 2), aisle("drinks", 1)])).toEqual([
      "bakery:1",
      "Chilled & frozen:3",
      "drinks:1",
    ]);
  });

  it("keeps the other aisle and unknown aisles as they are", () => {
    expect(shape([aisle("household", 1), aisle("other", 1), aisle("baby", 1)])).toEqual([
      "Non-food:2",
      "other:1",
    ]);
  });

  it("keeps the items in aisle order inside a merged section", () => {
    const [market] = groupSmallAisles([aisle("bakery", 1), aisle("fish", 2)], en.aisleFamilies);
    expect(market!.foods).toEqual(["bakery1", "fish1", "fish2"]);
  });

  it("does nothing without the rules", () => {
    setRules({ ...rules(), aisleGroups: undefined });
    expect(shape([aisle("meat", 1), aisle("fish", 1)])).toEqual(["meat:1", "fish:1"]);
  });
});
