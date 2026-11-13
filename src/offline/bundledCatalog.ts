import bundled from "./bundledCatalog.json";
import { isRules } from "./rules";
import type { Catalog } from "./types";

export const bundledCatalog = (): Catalog | null => {
  const pack = bundled as unknown as Catalog | null;
  return pack?.foodBanks && Array.isArray(pack.prizes) && isRules(pack.rules) ? pack : null;
};
