import useAxios from "@/hooks/useAxios";
import useToast from "@/providers/ToastProvider";
import { UserType } from "@/types/model";
import React, { createContext, ReactNode } from "react";
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
  login: (username: string, password: string) => Promise<boolean>;
  signup: (payload: SignupPayload) => Promise<boolean>;
  logout: () => Promise<void>;
  mutateUser: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: true,
  login: async () => false,
  signup: async () => false,
  logout: async () => {},
  mutateUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast();
  const { cache } = useSWRConfig();

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

  const login = async (username: string, password: string) => {
    const res = await postLogin({ username, password });
    if (res.error) {
      showToast(res.error.message || "Email ou mot de passe incorrect");
      return false;
    }
    await mutateUser();
    return true;
  };

  const signup = async (payload: SignupPayload) => {
    const res = await postSignup(payload);
    if (res.error) {
      showToast(res.error.message || "An unexpected error occurred");
      return false;
    }
    await mutateUser();
    return true;
  };

  const logout = async () => {
    await postLogout({});
    for (const key of cache.keys()) {
      cache.delete(key);
    }
    await mutateUser(undefined);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, mutateUser }}
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
