import common from "@/i18n/common";
import useAxios from "@/hooks/useAxios";
import { onSessionEnded } from "@/offline/engine";
import startSync from "@/offline/startSync";
import useToast from "@/providers/ToastProvider";
import { UserType } from "@/types/model";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";

export type HouseholdChoice =
  | { householdChoice: "join"; joinCode: string }
  | { householdChoice: "create"; householdName?: string };

export type SignupPayload = {
  username: string;
  email: string;
  password: string;
} & HouseholdChoice;

export type AuthContextType = {
  user?: UserType;
  isLoading: boolean;
  needsOnboarding: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (payload: SignupPayload) => Promise<boolean>;
  logout: () => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  mutateUser: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: true,
  needsOnboarding: false,
  login: async () => false,
  signup: async () => false,
  logout: async () => false,
  deleteAccount: async () => false,
  mutateUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast();
  const { cache } = useSWRConfig();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const {
    data: user,
    isLoading,
    mutate: mutateUser,
  } = useSWR<UserType>(
    { url: "/me" },
    {
      onError: () => {},
      shouldRetryOnError: false,
      revalidateOnFocus: false,
    },
  );

  const { postData: postLogin } = useAxios("/login");
  const { postData: postSignup } = useAxios("/signup");
  const { postData: postLogout } = useAxios("/logout");
  const { deleteData: deleteUser } = useAxios("/users/delete");

  const login = async (username: string, password: string) => {
    const res = await postLogin({ username, password });
    if (res.error) {
      showToast(res.error.message || common.unexpected);
      return false;
    }
    await mutateUser();
    return true;
  };

  const signup = async (payload: SignupPayload) => {
    const res = await postSignup(payload);
    if (res.error) {
      showToast(res.error.message || common.unexpected);
      return false;
    }
    setNeedsOnboarding(true);
    await mutateUser();
    return true;
  };

  const clearSession = async () => {
    setNeedsOnboarding(false);
    for (const key of cache.keys()) {
      cache.delete(key);
    }
    await mutateUser(undefined);
  };

  const logout = async () => {
    const res = await postLogout({});
    if (res.error) {
      showToast(res.error.message || common.unexpected);
      return false;
    }
    await clearSession();
    return true;
  };

  useEffect(() => {
    startSync();
    onSessionEnded(clearSession);
    return () => onSessionEnded(null);
  }, []);

  const deleteAccount = async () => {
    const res = await deleteUser({ params: { id: user?.id } });
    if (res.error) {
      showToast(res.error.message || common.unexpected);
      return false;
    }
    await clearSession();
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        needsOnboarding,
        login,
        signup,
        logout,
        deleteAccount,
        mutateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
