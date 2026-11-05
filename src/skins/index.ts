import arcade from "./arcade";
import roast from "./roast";
import type { Skin } from "./types";

export const DEFAULT_SKIN_ID = "arcade";

export const SKINS: Skin[] = [roast, arcade];

export const findSkin = (id?: string | null): Skin =>
  SKINS.find((skin) => skin.id === id) ??
  SKINS.find((skin) => skin.id === DEFAULT_SKIN_ID)!;

export const caseFor = (skin: Skin, text: string) =>
  skin.textCase === "upper" ? text.toUpperCase() : text;

export type { Skin } from "./types";
