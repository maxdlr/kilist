import { deviceLang, isLang, Lang, setLang } from "@/i18n";
import axios from "@/services/axios";
import { UserType } from "@/types/model";
import React, { createContext, ReactNode, useCallback, useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

type LanguageContextType = {
  lang: Lang;
  choice: Lang | null;
  setLanguage: (lang: Lang | null) => Promise<boolean>;
};

const LanguageContext = createContext<LanguageContextType>({
  lang: deviceLang(),
  choice: null,
  setLanguage: async () => false,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { mutate: revalidateAll } = useSWRConfig();
  const { data: user, mutate } = useSWR<UserType>(
    { url: "/me" },
    { onError: () => {}, shouldRetryOnError: false, revalidateOnFocus: false },
  );
  const [pending, setPending] = useState<Lang | null | undefined>(undefined);

  const saved = pending !== undefined ? pending : user?.language;
  const choice = isLang(saved) ? saved : null;
  const lang = choice ?? deviceLang();
  setLang(lang);

  const setLanguage = useCallback(
    async (next: Lang | null) => {
      setPending(next);
      if (next) setLang(next);
      try {
        const res = await axios.put<UserType>("/me/language", { language: next });
        await mutate(res.data, { revalidate: false });
        await revalidateAll((key) => !(typeof key === "object" && key && (key as { url?: string }).url === "/me"));
        return true;
      } catch {
        return false;
      } finally {
        setPending(undefined);
      }
    },
    [mutate, revalidateAll],
  );

  const value = useMemo(() => ({ lang, choice, setLanguage }), [lang, choice, setLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => React.useContext(LanguageContext);
