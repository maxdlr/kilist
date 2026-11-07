import common from "@/i18n/common";
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
  const { user, logout, deleteAccount } = useAuth();
  const { household, switchHousehold } = useHousehold();
  const { showToast } = useToast();
  const { counter } = useTickets();
  const [openPanel, setOpenPanel] = useState<AccountPanel | null>(null);
  const { lang, choice } = useLanguage();
  const closePanel = useCallback(() => setOpenPanel(null), []);

  const joinCode = household?.joinCode ?? user?.household.joinCode ?? "";

  const logOut = async () => {
    await logout();
    router.replace("/login");
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
          if (success) router.replace("/login");
        },
      },
    ],
  };

  const shareCode = async () => {
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
