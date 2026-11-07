export const LANGS = ["en", "fr"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

export const LANGUAGE_NAMES: Record<Lang, string> = {
  en: "English",
  fr: "Français",
};

export const isLang = (value: unknown): value is Lang =>
  typeof value === "string" && (LANGS as readonly string[]).includes(value);

export const deviceLang = (): Lang => {
  try {
    const code = Intl.DateTimeFormat().resolvedOptions().locale.slice(0, 2).toLowerCase();
    return isLang(code) ? code : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
};

let current: Lang = deviceLang();

export const getLang = () => current;

export const setLang = (lang: Lang) => {
  current = lang;
};

export const localized = <T extends object>(texts: Record<Lang, T>): T =>
  new Proxy({} as T, {
    get: (_, key) => texts[current][key as keyof T],
  });
