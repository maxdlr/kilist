import common from "@/i18n/common";
import useAxios from "@/hooks/useAxios";
import { getCatalog } from "@/offline/catalog";
import { countSignup } from "@/offline/stats";
import { onSessionEnded } from "@/offline/engine";
import { GUEST_USER_ID, makeGuestSnapshot } from "@/offline/guest";
import startSync from "@/offline/startSync";
import { unregisterPushToken } from "@/notifications/push";
import {
  consumeIntro,
  exportGuest,
  hasGuestData,
  isIntroPending,
  isSessionEnded,
  startGuest,
  subscribeStore,
  wipe,
} from "@/offline/store";
import axios from "@/services/axios";
import { askGoogleIdToken } from "@/services/googleSignIn";
import { DEFAULT_SKIN_ID } from "@/skins";
import { problemOf, type Problem } from "@/utils/problem";
import { UserType } from "@/types/model";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
  isGuest: boolean;
  sessionExpired: boolean;
  needsOnboarding: boolean;
  pendingIntro: boolean;
  consumeIntro: () => void;
  mergePending: boolean;
  resolveMerge: (keep: boolean) => Promise<Problem | null>;
  login: (username: string, password: string) => Promise<true | "merge" | Problem>;
  signup: (payload: SignupPayload) => Promise<true | "join" | Problem>;
  loginWithGoogle: () => Promise<boolean | "merge" | Problem>;
  completeJoin: (join: { joinCode: string; code: string } | null) => Promise<Problem | null>;
  logout: () => Promise<Problem | null>;
  deleteAccount: () => Promise<Problem | null>;
  mutateUser: (data?: UserType) => unknown;
  guestName: string;
  rename: (username: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: true,
  isGuest: false,
  sessionExpired: false,
  needsOnboarding: false,
  pendingIntro: false,
  consumeIntro: () => {},
  mergePending: false,
  resolveMerge: async () => null,
  login: async () => problemOf(null),
  signup: async () => problemOf(null),
  loginWithGoogle: async () => false,
  completeJoin: async () => null,
  logout: async () => null,
  deleteAccount: async () => null,
  mutateUser: () => {},
  guestName: "",
  rename: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { cache } = useSWRConfig();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const pendingIntro = useSyncExternalStore(subscribeStore, isIntroPending, isIntroPending);
  const [mergePending, setMergePending] = useState(false);
  const emailConfirmed = useRef(false);

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

  const isGuest = user?.id === GUEST_USER_ID;
  const sessionExpired = !user && !isLoading && isSessionEnded();

  const { postData: postLogin } = useAxios("/login");
  const { postData: postSignup } = useAxios("/signup");
  const { postData: postGoogle } = useAxios("/login/google");
  const { postData: postLogout } = useAxios("/logout");
  const { deleteData: deleteUser } = useAxios("/users/delete");

  const clearCache = useCallback(() => {
    for (const key of cache.keys()) {
      cache.delete(key);
    }
  }, [cache]);

  useEffect(() => {
    if (isLoading || user || isSessionEnded()) return;
    startGuest(makeGuestSnapshot("", DEFAULT_SKIN_ID, getCatalog()?.prizes));
    clearCache();
    mutateUser();
  }, [isLoading, user, clearCache, mutateUser]);

  const rename = async (username: string) => {
    const { data } = await axios.put<UserType>("/me/username", { username });
    await mutateUser(data, { revalidate: false });
  };

  const enterAccount = async () => {
    wipe();
    setMergePending(false);
    clearCache();
    await mutateUser();
  };

  const login = async (username: string, password: string) => {
    const res = await postLogin({ username, password });
    if (res.error) return problemOf(res.error);
    if (isGuest && hasGuestData()) {
      setMergePending(true);
      return "merge" as const;
    }
    await enterAccount();
    return true;
  };

  const resolveMerge = async (keep: boolean) => {
    if (keep) {
      try {
        await axios.post("/sync/import", exportGuest(), { network: true } as object);
      } catch (error) {
        return problemOf(error);
      }
    }
    await enterAccount();
    return null;
  };

  const signup = async (payload: SignupPayload) => {
    const guest = isGuest && hasGuestData() ? exportGuest() : undefined;
    const joining = payload.householdChoice === "join";
    const res = await postSignup({ ...payload, ...(guest && !joining && { guest }) });
    if (res.error) return problemOf(res.error);
    countSignup();
    setNeedsOnboarding(!guest);
    if (joining) return "join" as const;
    await enterAccount();
    return true;
  };

  const loginWithGoogle = async () => {
    let idToken: string | null;
    try {
      idToken = await askGoogleIdToken();
    } catch (error) {
      const code = (error as { code?: string | number } | null)?.code;
      console.warn("Google sign-in failed", error);
      return { message: code ? `${common.google.failed} (${code})` : common.google.failed, fields: [], code: "google" };
    }
    if (!idToken) return false;

    const guest = isGuest && hasGuestData() ? exportGuest() : undefined;
    const res = await postGoogle<{ created: boolean }>({ idToken, ...(guest && { guest }) });
    if (res.error) return problemOf(res.error);
    if (res.data?.created) {
      countSignup();
      setNeedsOnboarding(!guest);
    } else if (guest) {
      setMergePending(true);
      return "merge" as const;
    }
    await enterAccount();
    return true;
  };

  const completeJoin = async (join: { joinCode: string; code: string } | null) => {
    const online = { network: true } as object;
    try {
      if (join) {
        if (!emailConfirmed.current) {
          await axios.post("/me/email/confirm", { code: join.code }, online);
          emailConfirmed.current = true;
        }
        await axios.post("/households/switch", { householdChoice: "join", joinCode: join.joinCode }, online);
      }
      if (isGuest && hasGuestData()) await axios.post("/sync/import", exportGuest(), online);
    } catch (error) {
      return problemOf(error);
    }
    emailConfirmed.current = false;
    await enterAccount();
    return null;
  };

  const clearSession = async () => {
    setNeedsOnboarding(false);
    clearCache();
    await mutateUser(undefined);
  };

  const logout = async () => {
    await unregisterPushToken();
    const res = await postLogout({});
    if (res.error) return problemOf(res.error);
    await clearSession();
    return null;
  };

  useEffect(() => {
    startSync(axios);
    onSessionEnded(clearSession);
    return () => onSessionEnded(null);
  }, []);

  const deleteAccount = async () => {
    const res = await deleteUser({ params: { id: user?.id } });
    if (res.error) return problemOf(res.error);
    await clearSession();
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user: isGuest && user && !user.username ? { ...user, username: common.guestName } : user,
        guestName: isGuest ? (user?.username ?? "") : "",
        rename,
        isLoading,
        isGuest,
        sessionExpired,
        needsOnboarding,
        pendingIntro,
        consumeIntro,
        mergePending,
        resolveMerge,
        login,
        signup,
        loginWithGoogle,
        completeJoin,
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
