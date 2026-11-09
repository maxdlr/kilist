import type { AxiosInstance } from "axios";
import { applyCatalog, loadValue, saveValue } from "./store";
import type { Catalog } from "./types";

const KEY_CATALOG = "catalog";

let catalog: Catalog | null | undefined;

export const getCatalog = () => {
  if (catalog === undefined) catalog = loadValue<Catalog>(KEY_CATALOG) ?? null;
  return catalog;
};

export const refreshCatalog = async (client: AxiosInstance) => {
  try {
    const { data } = await client.get<Catalog>("/catalog", { network: true } as object);
    if (!data?.foodBanks || !Array.isArray(data.prizes)) return;
    catalog = data;
    saveValue(KEY_CATALOG, data);
    applyCatalog(data);
  } catch {
    return;
  }
};

export const resetCatalogForTests = () => {
  catalog = undefined;
};
