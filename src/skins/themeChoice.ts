import db from "@/offline/db";
import { CUSTOM_THEME_ID } from "./customTheme";

const LEGACY_CUSTOM = "blood";

const keyOf = (skinId: string) => `keep:theme:${skinId}`;
const colorKeyOf = (skinId: string) => `keep:theme:${skinId}:color`;
const known = new Map<string, string | undefined>();
const knownColors = new Map<string, string | undefined>();

export const savedTheme = (skinId: string) => {
  if (!known.has(skinId)) {
    const saved = db.loadValue<string>(keyOf(skinId));
    known.set(skinId, saved === LEGACY_CUSTOM ? CUSTOM_THEME_ID : saved);
  }
  return known.get(skinId);
};

export const saveTheme = (skinId: string, themeId: string) => {
  known.set(skinId, themeId);
  db.saveValue(keyOf(skinId), themeId);
};

export const savedColor = (skinId: string) => {
  if (!knownColors.has(skinId)) knownColors.set(skinId, db.loadValue<string>(colorKeyOf(skinId)));
  return knownColors.get(skinId);
};

export const saveColor = (skinId: string, color: string) => {
  knownColors.set(skinId, color);
  db.saveValue(colorKeyOf(skinId), color);
};
