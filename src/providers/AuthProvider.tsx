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
import { DEFAULT_SKIN_ID } from "@/skins";
import useToast from "@/providers/ToastProvider";
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
  resolveMerge: (keep: boolean) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean | "merge">;
  signup: (payload: SignupPayload) => Promise<boolean | "join">;
  completeJoin: (join: { joinCode: string; code: string } | null) => Promise<boolean>;
  logout: () => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  mutateUser: (data?: UserType) => unknown;
  guestName: string;
  renameGuest: (username: string) => Promise<void>;
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
  resolveMerge: async () => false,
  login: async () => false,
  signup: async () => false,
  completeJoin: async () => false,
  logout: async () => false,
  deleteAccount: async () => false,
  mutateUser: () => {},
  guestName: "",
  renameGuest: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast();
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

  const renameGuest = async (username: string) => {
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
    if (res.error) {
      showToast(res.error.message || common.unexpected);
      return false;
    }
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
      } catch (error: any) {
        showToast(error?.response?.data?.message || common.needsConnection);
        return false;
      }
    }
    await enterAccount();
    return true;
  };

  const signup = async (payload: SignupPayload) => {
    const guest = isGuest && hasGuestData() ? exportGuest() : undefined;
    const joining = payload.householdChoice === "join";
    const res = await postSignup({ ...payload, ...(guest && !joining && { guest }) });
    if (res.error) {
      showToast(res.error.message || common.unexpected);
      return false;
    }
    countSignup();
    setNeedsOnboarding(!guest);
    if (joining) return "join" as const;
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
    } catch (error: any) {
      showToast(error?.response?.data?.message || common.needsConnection);
      return false;
    }
    emailConfirmed.current = false;
    await enterAccount();
    return true;
  };

  const clearSession = async () => {
    setNeedsOnboarding(false);
    clearCache();
    await mutateUser(undefined);
  };

  const logout = async () => {
    await unregisterPushToken();
    const res = await postLogout({});
    if (res.error) {
      showToast(res.error.message || common.unexpected);
      return false;
    }
    await clearSession();
    return true;
  };

  useEffect(() => {
    startSync(axios);
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
        user: isGuest && user && !user.username ? { ...user, username: common.guestName } : user,
        guestName: isGuest ? (user?.username ?? "") : "",
        renameGuest,
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
