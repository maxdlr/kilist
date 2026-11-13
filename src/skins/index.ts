import { getLang, type Lang } from "@/i18n";
import arcade from "./arcade";
import calm from "./calm";
import roast from "./roast";
import versus from "./versus";
import type { Skin, SkinPaint, SkinSource } from "./types";

export const DEFAULT_SKIN_ID = "calm";

export const SKINS: SkinSource[] = [roast, arcade, versus, calm];

const localized = new Map<string, Skin>();

export const localize = (source: SkinSource, lang: Lang, themeId?: string | null): Skin => {
  const { copies, themes = [], defaultTheme, ...rest } = source;
  const theme =
    themes.find((entry) => entry.id === themeId) ??
    themes.find((entry) => entry.id === defaultTheme) ??
    themes[0];
  const key = `${source.id}:${lang}:${theme?.id ?? ""}`;
  const cached = localized.get(key);
  if (cached) return cached;
  const painted = (paint: SkinPaint) => ({
    colors: paint.colors,
    actions: paint.actions,
    panel: { ...rest.panel, ...paint.panel },
    shape: { ...rest.shape, shadow: { ...rest.shape.shadow, color: paint.shadow } },
  });
  const base: Skin = {
    ...rest,
    copy: copies[lang],
    tagline: copies[lang].tagline,
    themes: themes.map((entry) => ({ id: entry.id, name: entry.name[lang] })),
    theme: theme ? { id: theme.id, name: theme.name[lang], elements: theme.elements } : null,
    onPanel: null,
    ...(theme && { statusBarOnGround: theme.paint.statusBarOnGround, ...painted(theme.paint) }),
  };
  const skin: Skin = theme?.panel
    ? {
        ...base,
        onPanel: {
          ...base,
          ...painted(theme.panel.paint),
          theme: { ...base.theme!, elements: theme.panel.elements },
        },
      }
    : base;
  localized.set(key, skin);
  return skin;
};

export const findSkin = (id?: string | null, lang: Lang = getLang(), themeId?: string | null): Skin =>
  localize(
    SKINS.find((skin) => skin.id === id) ??
      SKINS.find((skin) => skin.id === DEFAULT_SKIN_ID)!,
    lang,
    themeId,
  );

export const caseFor = (skin: Skin, text: string) =>
  skin.textCase === "upper" ? text.toUpperCase() : text;

export type { Skin, SkinSource } from "./types";
