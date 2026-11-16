import type { Skin } from "@/skins/types";

export const sheetAt = (skin: Skin, position: number) =>
  skin.colors.sheets[position % skin.colors.sheets.length]!;
