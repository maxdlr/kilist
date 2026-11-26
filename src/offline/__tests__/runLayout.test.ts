import { describe, expect, it } from "vitest";
import type { FoodType } from "@/types/model";
import type { AisleSection } from "../aisleGroups";
import { emptyLayout, keepLayout, placeFoods, sectionsOfLayout } from "../runLayout";

const food = (id: number, aisle: string) => ({ id, name: `food${id}`, aisle }) as FoodType;

const byAisle = (foods: FoodType[]): AisleSection<FoodType>[] => {
  const ids = [...new Set(foods.map((item) => item.aisle!))];
  return ids.map((id) => ({ id, label: id, foods: foods.filter((item) => item.aisle === id) }));
};

const merged = (foods: FoodType[]): AisleSection<FoodType>[] => [{ id: "family:cold", label: "cold", foods }];

const shape = (sections: ReturnType<typeof sectionsOfLayout>) =>
  sections.map((section) => `${section.id}:${section.open.map((item) => item.id).join(",")}|${section.done.length}/${section.total}`);

describe("run layout", () => {
  it("counts open and done foods per section", () => {
    const milk = food(1, "dairy");
    const eggs = food(2, "dairy");
    const peas = food(3, "frozen");
    const layout = placeFoods(emptyLayout(1), [milk, eggs, peas], byAisle);
    expect(shape(sectionsOfLayout(layout, [eggs, peas], [milk]))).toEqual(["dairy:2|1/2", "frozen:3|0/1"]);
  });

  it("hides the suggested food from its section but still counts it", () => {
    const milk = food(1, "dairy");
    const eggs = food(2, "dairy");
    const layout = placeFoods(emptyLayout(1), [milk, eggs], byAisle);
    expect(shape(sectionsOfLayout(layout, [milk, eggs], [], 2))).toEqual(["dairy:1|0/2"]);
  });

  it("keeps a merged section once the trip runs, even when it shrinks", () => {
    const milk = food(1, "dairy");
    const peas = food(2, "frozen");
    const start = keepLayout(emptyLayout(null), 7, [milk, peas], merged);
    const later = keepLayout(start, 7, [peas, milk], byAisle);
    expect(later).toBe(start);
    expect(shape(sectionsOfLayout(later, [peas], [milk]))).toEqual(["family:cold:2|1/2"]);
  });

  it("drops a section once nothing is left in it", () => {
    const layout = placeFoods(emptyLayout(1), [food(1, "dairy"), food(2, "frozen")], byAisle);
    expect(shape(sectionsOfLayout(layout, [food(2, "frozen")], []))).toEqual(["frozen:2|0/1"]);
  });

  it("moves a food whose aisle was changed during the trip", () => {
    const start = keepLayout(emptyLayout(null), 7, [food(1, "other")], byAisle);
    const moved = keepLayout(start, 7, [food(1, "dairy")], byAisle);
    expect(moved.placed[1]).toBe("dairy");
  });

  it("puts a food added mid-trip into the section its aisle already joined", () => {
    const start = keepLayout(emptyLayout(null), 7, [food(1, "dairy"), food(2, "frozen")], merged);
    const later = keepLayout(start, 7, [food(1, "dairy"), food(2, "frozen"), food(3, "dairy")], byAisle);
    expect(later.placed[3]).toBe("family:cold");
    expect(Object.keys(later.meta)).toEqual(["family:cold"]);
  });

  it("gives a food from a new aisle its own section mid-trip", () => {
    const start = keepLayout(emptyLayout(null), 7, [food(1, "dairy")], merged);
    const later = keepLayout(start, 7, [food(1, "dairy"), food(2, "pantry")], byAisle);
    expect(later.placed[2]).toBe("pantry");
  });

  it("restores the saved layout of the same trip instead of regrouping", () => {
    const saved = keepLayout(emptyLayout(null), 7, [food(1, "dairy"), food(2, "frozen")], merged);
    const restored = keepLayout(emptyLayout(null), 7, [food(2, "frozen")], byAisle, saved);
    expect(restored.placed[2]).toBe("family:cold");
  });

  it("starts over for a new trip", () => {
    const first = keepLayout(emptyLayout(null), 7, [food(1, "dairy")], merged);
    const next = keepLayout(first, 8, [food(1, "dairy")], byAisle);
    expect(next.placed[1]).toBe("dairy");
  });
});
