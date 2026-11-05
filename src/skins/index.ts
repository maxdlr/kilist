import roast from "./roast";
import type { Skin } from "./types";

export const DEFAULT_SKIN_ID = "roast";

export const SKINS: Skin[] = [roast];

export const findSkin = (id?: string | null): Skin =>
  SKINS.find((skin) => skin.id === id) ??
  SKINS.find((skin) => skin.id === DEFAULT_SKIN_ID)!;

export type { Skin } from "./types";
