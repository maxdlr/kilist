import { getLang } from "@/i18n";
import common from "@/i18n/common";
import { groupSmallAisles } from "@/offline/aisleGroups";
import { aisleList, aisleName, aisleOf } from "@/offline/foodNames";
import { FoodType } from "@/types/model";
import { useState } from "react";

export const OTHER_AISLE = "other";

export type ShopSection = { id: string; label: string; foods: FoodType[] };

export const shopSections = (foods: FoodType[], otherLabel: string): ShopSection[] => {
  const lang = getLang();
  const byAisle = new Map<string, FoodType[]>();
  for (const food of foods) {
    const aisle = aisleOf(food) ?? OTHER_AISLE;
    byAisle.set(aisle, [...(byAisle.get(aisle) ?? []), food]);
  }
  const known = aisleList().filter((aisle) => byAisle.has(aisle.id));
  const rest = [...byAisle.keys()].filter((id) => !known.some((aisle) => aisle.id === id));
  return groupSmallAisles(
    [
      ...known.map((aisle) => ({ id: aisle.id, label: aisleName(aisle, lang), foods: byAisle.get(aisle.id)! })),
      ...(rest.length > 0
        ? [{ id: OTHER_AISLE, label: otherLabel, foods: rest.flatMap((id) => byAisle.get(id)!) }]
        : []),
    ],
    common.aisleFamilies,
  );
};

export type RunAisle = { id: string; label: string; foods: FoodType[]; count: number };

type Layout = {
  key: unknown;
  placed: Record<number, string>;
  order: Record<number, number>;
  sources: Record<number, string | null>;
  meta: Record<string, { label: string; rank: number }>;
};

type Focus = { open: string | null; seen: { id: string | null; count: number } };

const LAST = Number.MAX_SAFE_INTEGER;

const rankOf = (foods: FoodType[]) => {
  const order = aisleList().map((aisle) => aisle.id);
  const ranks = foods.map((food) => {
    const index = order.indexOf(aisleOf(food) ?? "");
    return index < 0 ? LAST : index;
  });
  return Math.min(...ranks);
};

const placeFoods = (base: Layout, foods: FoodType[], otherLabel: string): Layout => {
  const placed = { ...base.placed };
  const order = { ...base.order };
  const sources = { ...base.sources };
  const meta = { ...base.meta };
  let next = Object.keys(order).length;
  for (const section of shopSections(foods, otherLabel)) {
    for (const food of section.foods) {
      if (placed[food.id] !== undefined) continue;
      placed[food.id] = section.id;
      sources[food.id] = food.aisle ?? null;
      if (order[food.id] === undefined) order[food.id] = next++;
      if (!meta[section.id]) {
        meta[section.id] = { label: section.label, rank: section.id === OTHER_AISLE ? LAST : rankOf(section.foods) };
      }
    }
  }
  return { key: base.key, placed, order, sources, meta };
};

const useRunAisles = ({
  foods,
  suggestionId,
  runKey,
  otherLabel,
}: {
  foods: FoodType[];
  suggestionId?: number;
  runKey: unknown;
  otherLabel: string;
}) => {
  const [layout, setLayout] = useState<Layout>({ key: runKey, placed: {}, order: {}, sources: {}, meta: {} });
  const [focus, setFocus] = useState<Focus>({ open: null, seen: { id: null, count: 0 } });

  let current = layout.key === runKey ? layout : { key: runKey, placed: {}, order: {}, sources: {}, meta: {} };
  const moved = foods.filter(
    (food) => current.placed[food.id] !== undefined && current.sources[food.id] !== (food.aisle ?? null),
  );
  if (moved.length > 0) {
    const placed = { ...current.placed };
    for (const food of moved) delete placed[food.id];
    current = { ...current, placed };
  }
  if (foods.some((food) => current.placed[food.id] === undefined)) current = placeFoods(current, foods, otherLabel);
  if (current !== layout) setLayout(current);
  const own = layout.key === runKey ? focus : { open: null, seen: { id: null, count: 0 } };

  const aisles: RunAisle[] = Object.entries(current.meta)
    .sort((a, b) => a[1].rank - b[1].rank)
    .map(([id, { label }]) => {
      const all = foods
        .filter((food) => current.placed[food.id] === id)
        .sort((a, b) => (current.order[a.id] ?? 0) - (current.order[b.id] ?? 0));
      return { id, label, count: all.length, foods: all.filter((food) => food.id !== suggestionId) };
    });

  const suggestionAisle = suggestionId !== undefined ? (current.placed[suggestionId] ?? null) : null;
  const shown = aisles.find((aisle) => aisle.id === own.open);
  const fallback = () => {
    const from = aisles.findIndex((aisle) => aisle.id === own.open);
    if (from >= 0) {
      for (let distance = 1; distance < aisles.length; distance += 1) {
        const right = aisles[from + distance];
        if (right && right.count > 0) return right.id;
        const left = aisles[from - distance];
        if (left && left.count > 0) return left.id;
      }
    }
    if (suggestionAisle && aisles.some((aisle) => aisle.id === suggestionAisle && aisle.count > 0)) {
      return suggestionAisle;
    }
    return aisles.find((aisle) => aisle.count > 0)?.id ?? aisles[0]?.id ?? null;
  };
  const emptied =
    shown !== undefined &&
    shown.count === 0 &&
    own.seen.id === shown.id &&
    own.seen.count > 0 &&
    aisles.some((aisle) => aisle.count > 0);
  const target = !shown || emptied ? fallback() : own.open;
  const targetCount = aisles.find((aisle) => aisle.id === target)?.count ?? 0;

  if (own !== focus || own.open !== target || own.seen.id !== target || own.seen.count !== targetCount) {
    setFocus({ open: target, seen: { id: target, count: targetCount } });
  }

  return {
    aisles,
    open: aisles.find((aisle) => aisle.id === target) ?? null,
    aisleOfFood: (foodId: number) => current.placed[foodId] ?? null,
    setOpen: (id: string) => setFocus((state) => ({ ...state, open: id })),
  };
};

export default useRunAisles;
