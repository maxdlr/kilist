import useAxios from "@/hooks/useAxios";
import useAuth, { HouseholdChoice } from "@/providers/AuthProvider";
import useToast from "@/providers/ToastProvider";
import { HouseholdWithMembersType } from "@/types/model";
import React, { createContext, ReactNode } from "react";
import useSWR, { useSWRConfig } from "swr";

export type HouseholdContextType = {
  household?: HouseholdWithMembersType;
  isLoading: boolean;
  mutateHousehold: () => void;
  switchHousehold: (choice: HouseholdChoice) => Promise<boolean>;
};

const HouseholdContext = createContext<HouseholdContextType>({
  household: undefined,
  isLoading: true,
  mutateHousehold: () => {},
  switchHousehold: async () => false,
});

export const HouseholdProvider = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast();
  const { mutateUser } = useAuth();
  const { mutate: mutateCache } = useSWRConfig();

  const {
    data: household,
    isLoading,
    mutate: mutateHousehold,
  } = useSWR<HouseholdWithMembersType>(
    { url: "/households/me" },
    {
      onError: (err) =>
        showToast(err?.message || "An unexpected error occurred"),
      revalidateOnFocus: true,
    },
  );

  const { postData: postSwitch } = useAxios("/households/switch");

  const switchHousehold = async (choice: HouseholdChoice) => {
    const res = await postSwitch(choice);
    if (res.error) {
      showToast(res.error.message || "An unexpected error occurred");
      return false;
    }
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
    return true;
  };

  return (
    <HouseholdContext.Provider
      value={{ household, isLoading, mutateHousehold, switchHousehold }}
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
