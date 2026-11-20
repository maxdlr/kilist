import common from "@/i18n/common";
import useAxios from "@/hooks/useAxios";
import useAuth, { HouseholdChoice } from "@/providers/AuthProvider";
import { useReportFeedback } from "@/providers/FeedbackStore";
import { problemOf, type Problem } from "@/utils/problem";
import axios from "@/services/axios";
import { HouseholdWithMembersType } from "@/types/model";
import React, { createContext, ReactNode } from "react";
import useSWR, { useSWRConfig } from "swr";
import { isQuietError } from "@/services/fetcher";

export type HouseholdContextType = {
  household?: HouseholdWithMembersType;
  isLoading: boolean;
  mutateHousehold: () => void;
  switchHousehold: (choice: HouseholdChoice) => Promise<Problem | null>;
  renameHousehold: (name: string) => Promise<void>;
};

const HouseholdContext = createContext<HouseholdContextType>({
  household: undefined,
  isLoading: true,
  mutateHousehold: () => {},
  switchHousehold: async () => null,
  renameHousehold: async () => {},
});

export const HouseholdProvider = ({ children }: { children: ReactNode }) => {
  const report = useReportFeedback();
  const { mutateUser } = useAuth();
  const { mutate: mutateCache } = useSWRConfig();

  const {
    data: household,
    isLoading,
    mutate: mutateHousehold,
  } = useSWR<HouseholdWithMembersType>(
    { url: "/households/me" },
    {
      onSuccess: () => report("account", null),
      onError: (err) =>
        !isQuietError(err) &&
        report("account", {
          tone: "error",
          title: common.feedback.load.household,
          body: err?.message || common.feedback.loadLine,
          action: { label: common.feedback.retry, onPress: () => mutateHousehold() },
        }),
      revalidateOnFocus: true,
    },
  );

  const { postData: postSwitch } = useAxios("/households/switch");

  const switchHousehold = async (choice: HouseholdChoice) => {
    const res = await postSwitch(choice);
    if (res.error) return problemOf(res.error);
    // The user's household changed, so refresh both the household view and
    // the auth user (whose household relation is now stale).
    await Promise.all([
      mutateHousehold(),
      mutateUser(),
      mutateCache(
        (key) => {
          const url = (key as { url?: string } | undefined)?.url;
          return url !== "/me" && url !== "/households/me";
        },
        undefined,
        { revalidate: true },
      ),
    ]);
    return null;
  };

  const renameHousehold = async (name: string) => {
    await axios.put("/households/name", { name });
    await Promise.all([mutateHousehold(), mutateUser()]);
  };

  return (
    <HouseholdContext.Provider
      value={{
        household,
        isLoading,
        mutateHousehold,
        switchHousehold,
        renameHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

const useHousehold = () => {
  const context = React.useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
};

export default useHousehold;
