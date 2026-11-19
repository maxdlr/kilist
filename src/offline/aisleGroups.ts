import { rules } from "./rules";

export type AisleSection<T> = { id: string; label: string; foods: T[] };

export const familySectionId = (key: string) => `family:${key}`;

export const groupSmallAisles = <T>(
  sections: AisleSection<T>[],
  familyNames: Record<string, string>,
): AisleSection<T>[] => {
  const groups = rules().aisleGroups;
  if (!groups) return sections;

  const familyOf = new Map<string, string>();
  for (const family of groups.families) {
    for (const aisle of family.aisles) familyOf.set(aisle, family.key);
  }

  const smallFamily = (section: AisleSection<T>) =>
    section.foods.length <= groups.maxItems ? familyOf.get(section.id) : undefined;

  const smallCount = new Map<string, number>();
  for (const section of sections) {
    const family = smallFamily(section);
    if (family) smallCount.set(family, (smallCount.get(family) ?? 0) + 1);
  }

  const merged = new Map<string, AisleSection<T>>();
  const result: AisleSection<T>[] = [];
  for (const section of sections) {
    const family = smallFamily(section);
    if (!family || (smallCount.get(family) ?? 0) < 2) {
      result.push(section);
      continue;
    }
    const existing = merged.get(family);
    if (existing) {
      existing.foods = [...existing.foods, ...section.foods];
      continue;
    }
    const group = { id: familySectionId(family), label: familyNames[family] ?? section.label, foods: section.foods };
    merged.set(family, group);
    result.push(group);
  }
  return result;
};
