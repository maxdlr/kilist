import db from "@/offline/db";

const keyOf = (skinId: string) => `keep:theme:${skinId}`;
const known = new Map<string, string | undefined>();

export const savedTheme = (skinId: string) => {
  if (!known.has(skinId)) known.set(skinId, db.loadValue<string>(keyOf(skinId)));
  return known.get(skinId);
};

export const saveTheme = (skinId: string, themeId: string) => {
  known.set(skinId, themeId);
  db.saveValue(keyOf(skinId), themeId);
};
