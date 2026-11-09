import common from "@/i18n/common";
import { useAccountGate } from "@/providers/AccountGateProvider";
import useAuth from "@/providers/AuthProvider";
import useHousehold from "@/providers/HouseholdProvider";
import { useSkin } from "@/providers/SkinProvider";
import useTickets from "@/providers/TicketsProvider";
import useToast from "@/providers/ToastProvider";
import { LANGUAGE_NAMES } from "@/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Share } from "react-native";

export type AccountPanel = "switch" | "qr" | "delete" | "credits" | "language";

const useAccount = () => {
  const skin = useSkin();
  const copy = skin.copy.account;
  const { user, isGuest, logout, deleteAccount } = useAuth();
  const { requireAccount } = useAccountGate();
  const { household, switchHousehold } = useHousehold();
  const { showToast } = useToast();
  const { counter } = useTickets();
  const [openPanel, setPanel] = useState<AccountPanel | null>(null);
  const setOpenPanel = (panel: AccountPanel | null) => {
    if (isGuest && (panel === "qr" || panel === "switch")) {
      requireAccount("household");
      return;
    }
    setPanel(panel);
  };
  const { lang, choice } = useLanguage();
  const closePanel = useCallback(() => setPanel(null), []);

  const joinCode = household?.joinCode ?? user?.household.joinCode ?? "";

  const logOut = async () => {
    if (await logout()) router.replace("/");
  };

  const deleteRequest = {
    title: copy.deleteTitle,
    message: copy.deleteLine,
    cancelLabel: copy.deleteKeep,
    actions: [
      {
        label: copy.deleteAction,
        destructive: true,
        onPress: async () => {
          const success = await deleteAccount();
          if (success) router.replace("/");
        },
      },
    ],
  };

  const shareCode = async () => {
    if (isGuest) {
      requireAccount("household");
      return;
    }
    try {
      await Share.share({
        message: common.shareMessage(joinCode),
      });
    } catch {
      showToast(common.shareFailed);
    }
  };

  const openIconsSite = async () => {
    try {
      await Linking.openURL("https://icons8.com");
    } catch {
      showToast(common.linkFailed);
    }
  };

  const switchTo: typeof switchHousehold = async (choice) => {
    const success = await switchHousehold(choice);
    if (success) showToast(common.householdSwitched, "info");
    return success;
  };

  return {
    user,
    isGuest,
    createAccount: () => router.push("/login?mode=signup"),
    logIn: () => router.push("/login"),
    isAdmin: user?.type === "admin",
    joinCode,
    householdName: household?.name ?? user?.household.name,
    members: household?.members ?? [],
    balance: counter?.balance ?? 0,
    openPanel,
    setOpenPanel,
    closePanel,
    deleteRequest,
    logOut,
    shareCode,
    openCredits: () => setOpenPanel("credits"),
    openLanguage: () => setOpenPanel("language"),
    languageName: choice ? LANGUAGE_NAMES[choice] : common.languageAuto(LANGUAGE_NAMES[lang]),
    openIconsSite,
    switchTo,
    replayOnboarding: () => router.push("/onboarding?intro=1"),
  };
};

export type Account = ReturnType<typeof useAccount>;

export default useAccount;
