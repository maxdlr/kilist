import { getLang, type Lang } from "@/i18n";
import calm from "./calm";
import roast from "./roast";
import versus from "./versus";
import { CUSTOM_THEME_ID } from "./customTheme";
import type { Skin, SkinPaint, SkinSource } from "./types";

export const DEFAULT_SKIN_ID = "calm";

export const SKINS: SkinSource[] = [roast, versus, calm];

const localized = new Map<string, Skin>();
const previewed = new Map<string, Skin>();
const PREVIEW_CACHE = 4;

export const localize = (
  source: SkinSource,
  lang: Lang,
  themeId?: string | null,
  customColor?: string | null,
): Skin => {
  const { copies, themes = [], defaultTheme, custom, ...rest } = source;
  const color = customColor ?? custom?.initial;
  const isCustom = Boolean(custom && color && themeId === CUSTOM_THEME_ID);
  const theme = isCustom
    ? custom!.make(color!)
    : (themes.find((entry) => entry.id === themeId) ??
      themes.find((entry) => entry.id === defaultTheme) ??
      themes[0]);
  const key = `${source.id}:${lang}:${theme?.id ?? ""}:${custom ? color : ""}`;
  const cached = localized.get(key) ?? previewed.get(key);
  if (cached) return cached;
  const painted = (paint: SkinPaint) => ({
    colors: paint.colors,
    actions: paint.actions,
    panel: { ...rest.panel, ...paint.panel },
    bottomPanel: paint.bottomPanel,
    shape: { ...rest.shape, shadow: { ...rest.shape.shadow, color: paint.shadow } },
  });
  const base: Skin = {
    ...rest,
    copy: copies[lang],
    tagline: copies[lang].tagline,
    themes: [
      ...themes.map((entry) => ({ id: entry.id, name: entry.name[lang] })),
      ...(custom ? [{ id: CUSTOM_THEME_ID, name: custom.name[lang], custom: true, color }] : []),
    ],
    theme: theme
      ? { id: theme.id, name: theme.name[lang], elements: theme.elements, ...(isCustom && { color }) }
      : null,
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
  if (isCustom) {
    if (previewed.size >= PREVIEW_CACHE) previewed.delete(previewed.keys().next().value!);
    previewed.set(key, skin);
  } else localized.set(key, skin);
  return skin;
};

export const findSkin = (
  id?: string | null,
  lang: Lang = getLang(),
  themeId?: string | null,
  customColor?: string | null,
): Skin =>
  localize(
    SKINS.find((skin) => skin.id === id) ??
      SKINS.find((skin) => skin.id === DEFAULT_SKIN_ID)!,
    lang,
    themeId,
    customColor,
  );

export const caseFor = (skin: Skin, text: string) =>
  skin.textCase === "upper" ? text.toUpperCase() : text;

export type { Skin, SkinSource } from "./types";
