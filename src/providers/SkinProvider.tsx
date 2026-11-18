import { DEFAULT_SKIN_ID, findSkin, Skin } from "@/skins";
import { CUSTOM_THEME_ID } from "@/skins/customTheme";
import { savedColor, saveColor, savedTheme, saveTheme } from "@/skins/themeChoice";
import axios from "@/services/axios";
import { useLanguage } from "./LanguageProvider";
import { UserType } from "@/types/model";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import useSWR from "swr";

type SkinContextType = {
  skin: Skin;
  setSkin: (id: string) => Promise<boolean>;
  setTheme: (id: string) => void;
  previewColor: (color: string | null) => void;
  setCustomColor: (color: string) => void;
};

const SkinContext = createContext<SkinContextType>({
  skin: findSkin(DEFAULT_SKIN_ID),
  setSkin: async () => false,
  setTheme: () => {},
  previewColor: () => {},
  setCustomColor: () => {},
});

export const SkinProvider = ({ children }: { children: ReactNode }) => {
  const { data: user, mutate } = useSWR<UserType>(
    { url: "/me" },
    { onError: () => {}, shouldRetryOnError: false, revalidateOnFocus: false },
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { lang } = useLanguage();

  const [picked, setPicked] = useState<Record<string, string>>({});
  const [colors, setColors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);

  const skinId = findSkin(pendingId ?? user?.skin, lang).id;
  const skin = findSkin(
    skinId,
    lang,
    preview ? CUSTOM_THEME_ID : (picked[skinId] ?? savedTheme(skinId)),
    preview ?? colors[skinId] ?? savedColor(skinId),
  );

  const setTheme = useCallback(
    (id: string) => {
      saveTheme(skinId, id);
      setPicked((current) => ({ ...current, [skinId]: id }));
    },
    [skinId],
  );

  const setCustomColor = useCallback(
    (color: string) => {
      saveColor(skinId, color);
      saveTheme(skinId, CUSTOM_THEME_ID);
      setColors((current) => ({ ...current, [skinId]: color }));
      setPicked((current) => ({ ...current, [skinId]: CUSTOM_THEME_ID }));
      setPreview(null);
    },
    [skinId],
  );

  const setSkin = useCallback(
    async (id: string) => {
      setPendingId(id);
      try {
        const res = await axios.put<UserType>("/me/skin", { skin: id });
        await mutate(res.data, { revalidate: false });
        return true;
      } catch {
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [mutate],
  );

  const value = useMemo(
    () => ({ skin, setSkin, setTheme, previewColor: setPreview, setCustomColor }),
    [skin, setSkin, setTheme, setCustomColor],
  );

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
};

export const SkinOverride = ({ id, children }: { id: string; children: ReactNode }) => {
  const parent = React.useContext(SkinContext);
  const { lang } = useLanguage();
  const value = useMemo(() => ({ ...parent, skin: findSkin(id, lang, savedTheme(id), savedColor(id)) }), [parent, id, lang]);

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
};

export const PanelSkin = ({ children }: { children: ReactNode }) => {
  const parent = React.useContext(SkinContext);
  const value = useMemo(
    () => (parent.skin.onPanel ? { ...parent, skin: parent.skin.onPanel } : parent),
    [parent],
  );

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
};

export const usePanelSkin = () => {
  const skin = React.useContext(SkinContext).skin;
  return skin.onPanel ?? skin;
};

export const useSkinSwitch = () => React.useContext(SkinContext);

export const useSkin = () => React.useContext(SkinContext).skin;

export const useSkinStyles = <T,>(factory: (skin: Skin) => T): T => {
  const skin = useSkin();
  return useMemo(() => factory(skin), [factory, skin]);
};

