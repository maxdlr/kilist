import type { AisleType, FoodBankItemType } from "@/types/model";

type Suggestion = { name: string; plain: string };

const MIN_QUERY = 2;

export const normalizeName = (name: string) => name.trim().toLowerCase();

const plainName = (name: string) =>
  normalizeName(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

let keyByName = new Map<string, string>();
let namesByKey = new Map<string, Record<string, string>>();
let aisleByName = new Map<string, string>();
let suggestions = new Map<string, Suggestion[]>();
let aisles: AisleType[] = [];

export const setFoodBanks = (
  banks?: Record<string, FoodBankItemType[]> | null,
  names?: Record<string, Record<string, string[]>> | null,
  aisleList?: AisleType[] | null,
) => {
  keyByName = new Map();
  namesByKey = new Map();
  aisleByName = new Map();
  suggestions = new Map();
  aisles = aisleList ?? [];

  const suggest = (lang: string, name: string, aisle?: string) => {
    const normalized = normalizeName(name);
    if (aisle && !aisleByName.has(normalized)) aisleByName.set(normalized, aisle);
    const list = suggestions.get(lang) ?? [];
    list.push({ name, plain: plainName(name) });
    suggestions.set(lang, list);
  };

  for (const [lang, items] of Object.entries(banks ?? {})) {
    for (const item of items) {
      suggest(lang, item.name, item.aisle);
      if (!item.key) continue;
      keyByName.set(normalizeName(item.name), item.key);
      namesByKey.set(item.key, { ...namesByKey.get(item.key), [lang]: item.name });
    }
  }
  for (const [lang, byAisle] of Object.entries(names ?? {})) {
    for (const [aisle, list] of Object.entries(byAisle)) {
      for (const name of list) suggest(lang, name, aisle);
    }
  }
};

export const foodKey = (name: string) => {
  const normalized = normalizeName(name);
  return keyByName.get(normalized) ?? normalized;
};

export const shownName = (name: string, lang: string) => namesByKey.get(foodKey(name))?.[lang] ?? name;

export const namesOf = (name: string) => Object.values(namesByKey.get(foodKey(name)) ?? { own: name });

export const aisleList = () => aisles;

const spellings = (name: string) => {
  const normalized = normalizeName(name);
  const [first, ...rest] = normalized.split(" ");
  const tail = rest.length > 0 ? ` ${rest.join(" ")}` : "";
  const singular = normalized.replace(/(es|s|x)$/, "");
  return [
    normalized,
    `${normalized}s`,
    `${normalized}es`,
    `${normalized}x`,
    singular,
    `${normalized.replace(/y$/, "")}ies`,
    `${first}s${tail}`,
    `${first}x${tail}`,
  ];
};

export const aisleOf = (food: { name: string; aisle?: string | null }) => {
  if (food.aisle) return food.aisle;
  for (const name of namesOf(food.name)) {
    for (const spelling of spellings(name)) {
      const aisle = aisleByName.get(spelling);
      if (aisle) return aisle;
    }
  }
  return null;
};

export const suggestNames = (query: string, lang: string, limit: number) => {
  const typed = plainName(query);
  if (typed.length < MIN_QUERY) return [];
  const starts: Suggestion[] = [];
  const inside: Suggestion[] = [];
  for (const entry of suggestions.get(lang) ?? []) {
    if (entry.plain === typed) continue;
    if (entry.plain.startsWith(typed)) starts.push(entry);
    else if (entry.plain.includes(` ${typed}`)) inside.push(entry);
  }
  const shortest = (a: Suggestion, b: Suggestion) => a.plain.length - b.plain.length;
  return [...starts.sort(shortest), ...inside.sort(shortest)].slice(0, limit).map((entry) => entry.name);
};
