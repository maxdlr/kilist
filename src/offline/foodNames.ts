import type { FoodBankItemType } from "@/types/model";

export const normalizeName = (name: string) => name.trim().toLowerCase();

let keyByName = new Map<string, string>();
let namesByKey = new Map<string, Record<string, string>>();

export const setFoodBanks = (banks?: Record<string, FoodBankItemType[]> | null) => {
  keyByName = new Map();
  namesByKey = new Map();
  for (const [lang, items] of Object.entries(banks ?? {})) {
    for (const item of items) {
      if (!item.key) continue;
      keyByName.set(normalizeName(item.name), item.key);
      namesByKey.set(item.key, { ...namesByKey.get(item.key), [lang]: item.name });
    }
  }
};

export const foodKey = (name: string) => {
  const normalized = normalizeName(name);
  return keyByName.get(normalized) ?? normalized;
};

export const shownName = (name: string, lang: string) => namesByKey.get(foodKey(name))?.[lang] ?? name;

export const namesOf = (name: string) => Object.values(namesByKey.get(foodKey(name)) ?? { own: name });
