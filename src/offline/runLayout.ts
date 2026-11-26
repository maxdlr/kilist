import type { FoodType } from "@/types/model";
import type { AisleSection } from "./aisleGroups";
import { aisleList, aisleOf } from "./foodNames";

export const OTHER_AISLE = "other";

const LAST = Number.MAX_SAFE_INTEGER;

export type RunLayout = {
  key: unknown;
  placed: Record<number, string>;
  order: Record<number, number>;
  sources: Record<number, string | null>;
  meta: Record<string, { label: string; rank: number }>;
  homes: Record<string, string>;
};

export type RunSection = { id: string; label: string; open: FoodType[]; done: FoodType[]; total: number };

type SectionsOf = (foods: FoodType[]) => AisleSection<FoodType>[];

export const emptyLayout = (key: unknown): RunLayout => ({ key, placed: {}, order: {}, sources: {}, meta: {}, homes: {} });

const rankOf = (foods: FoodType[]) => {
  const order = aisleList().map((aisle) => aisle.id);
  const ranks = foods.map((food) => {
    const index = order.indexOf(aisleOf(food) ?? "");
    return index < 0 ? LAST : index;
  });
  return Math.min(...ranks);
};

export const placeFoods = (base: RunLayout, foods: FoodType[], sectionsOf: SectionsOf): RunLayout => {
  const missing = foods.filter((food) => base.placed[food.id] === undefined);
  if (missing.length === 0) return base;
  const placed = { ...base.placed };
  const order = { ...base.order };
  const sources = { ...base.sources };
  const meta = { ...base.meta };
  const homes = { ...(base.homes ?? {}) };
  let next = Object.keys(order).length;
  for (const section of sectionsOf(foods)) {
    for (const food of section.foods) {
      if (placed[food.id] !== undefined) continue;
      const aisle = aisleOf(food) ?? OTHER_AISLE;
      const home = homes[aisle] ?? section.id;
      homes[aisle] = home;
      placed[food.id] = home;
      sources[food.id] = food.aisle ?? null;
      if (order[food.id] === undefined) order[food.id] = next++;
      if (!meta[home]) {
        meta[home] = { label: section.label, rank: home === OTHER_AISLE ? LAST : rankOf(section.foods) };
      }
    }
  }
  return { key: base.key, placed, order, sources, meta, homes };
};

export const keepLayout = (
  layout: RunLayout,
  key: unknown,
  foods: FoodType[],
  sectionsOf: SectionsOf,
  restored?: RunLayout | null,
) => {
  let current: RunLayout =
    layout.key === key ? layout : restored && restored.key === key ? restored : emptyLayout(key);
  const moved = foods.filter(
    (food) => current.placed[food.id] !== undefined && current.sources[food.id] !== (food.aisle ?? null),
  );
  if (moved.length > 0) {
    const placed = { ...current.placed };
    for (const food of moved) delete placed[food.id];
    current = { ...current, placed };
  }
  return placeFoods(current, foods, sectionsOf);
};

export const sectionsOfLayout = (
  layout: RunLayout,
  open: FoodType[],
  done: FoodType[],
  hiddenId?: number,
): RunSection[] => {
  const byOrder = (a: FoodType, b: FoodType) => (layout.order[a.id] ?? 0) - (layout.order[b.id] ?? 0);
  return Object.entries(layout.meta)
    .sort((a, b) => a[1].rank - b[1].rank)
    .map(([id, { label }]) => {
      const openHere = open.filter((food) => layout.placed[food.id] === id).sort(byOrder);
      const doneHere = done.filter((food) => layout.placed[food.id] === id);
      return {
        id,
        label,
        open: openHere.filter((food) => food.id !== hiddenId),
        done: doneHere,
        total: openHere.length + doneHere.length,
      };
    })
    .filter((section) => section.total > 0);
};
