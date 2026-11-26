import { getLang } from "@/i18n";
import common from "@/i18n/common";
import { groupSmallAisles } from "@/offline/aisleGroups";
import { aisleList, aisleName, aisleOf } from "@/offline/foodNames";
import {
  emptyLayout,
  keepLayout,
  OTHER_AISLE,
  placeFoods,
  type RunLayout,
  sectionsOfLayout,
} from "@/offline/runLayout";
import { deleteValues, loadValue, saveValue } from "@/offline/store";
import { FoodType } from "@/types/model";
import { useEffect, useState } from "react";

const LAYOUT_KEY = "runLayout:";

export { OTHER_AISLE, type RunSection } from "@/offline/runLayout";

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

const useRunAisles = ({
  open,
  done,
  hiddenId,
  runKey,
  frozen,
  otherLabel,
}: {
  open: FoodType[];
  done: FoodType[];
  hiddenId?: number;
  runKey: unknown;
  frozen: boolean;
  otherLabel: string;
}) => {
  const [kept, setKept] = useState<RunLayout>(() => emptyLayout(runKey));
  const sectionsOf = (foods: FoodType[]) => shopSections(foods, otherLabel);
  const all = [...open, ...done];
  const restored =
    frozen && runKey !== null && kept.key !== runKey
      ? (loadValue<RunLayout>(`${LAYOUT_KEY}${runKey}`) ?? (kept.key === null ? { ...kept, key: runKey } : null))
      : null;
  const layout = frozen
    ? keepLayout(kept, runKey, all, sectionsOf, restored)
    : placeFoods(emptyLayout(runKey), all, sectionsOf);
  if (frozen && layout !== kept) setKept(layout);

  useEffect(() => {
    if (!frozen || runKey === null || kept.key !== runKey) return;
    deleteValues(LAYOUT_KEY);
    saveValue(`${LAYOUT_KEY}${runKey}`, kept);
  }, [frozen, runKey, kept]);

  return {
    sections: sectionsOfLayout(layout, open, done, hiddenId),
    sectionOf: (foodId: number) => layout.placed[foodId] ?? null,
    labelOf: (sectionId: string | null) => (sectionId ? (layout.meta[sectionId]?.label ?? null) : null),
  };
};

export default useRunAisles;
