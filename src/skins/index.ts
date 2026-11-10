import { getLang, type Lang } from "@/i18n";
import arcade from "./arcade";
import calm from "./calm";
import roast from "./roast";
import versus from "./versus";
import type { Skin, SkinSource } from "./types";

export const DEFAULT_SKIN_ID = "calm";

export const SKINS: SkinSource[] = [roast, arcade, versus, calm];

const localized = new Map<string, Skin>();

export const localize = (source: SkinSource, lang: Lang): Skin => {
  const key = `${source.id}:${lang}`;
  const cached = localized.get(key);
  if (cached) return cached;
  const { copies, ...rest } = source;
  const skin: Skin = { ...rest, copy: copies[lang], tagline: copies[lang].tagline };
  localized.set(key, skin);
  return skin;
};

export const findSkin = (id?: string | null, lang: Lang = getLang()): Skin =>
  localize(
    SKINS.find((skin) => skin.id === id) ??
      SKINS.find((skin) => skin.id === DEFAULT_SKIN_ID)!,
    lang,
  );

export const caseFor = (skin: Skin, text: string) =>
  skin.textCase === "upper" ? text.toUpperCase() : text;

export type { Skin, SkinSource } from "./types";
