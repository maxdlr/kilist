import { DEFAULT_SKIN_ID, findSkin, Skin } from "@/skins";
import axios from "@/services/axios";
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
};

const SkinContext = createContext<SkinContextType>({
  skin: findSkin(DEFAULT_SKIN_ID),
  setSkin: async () => false,
});

export const SkinProvider = ({ children }: { children: ReactNode }) => {
  const { data: user, mutate } = useSWR<UserType>(
    { url: "/me" },
    { onError: () => {}, shouldRetryOnError: false, revalidateOnFocus: false },
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  const skin = findSkin(pendingId ?? user?.skin);

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

  const value = useMemo(() => ({ skin, setSkin }), [skin, setSkin]);

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
};

export const useSkinSwitch = () => React.useContext(SkinContext);

export const useSkin = () => React.useContext(SkinContext).skin;

export const useSkinStyles = <T,>(factory: (skin: Skin) => T): T => {
  const skin = useSkin();
  return useMemo(() => factory(skin), [factory, skin]);
};

