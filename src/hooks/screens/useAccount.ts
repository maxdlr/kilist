import common from "@/i18n/common";
import { useAccountGate } from "@/providers/AccountGateProvider";
import useAuth from "@/providers/AuthProvider";
import useHousehold from "@/providers/HouseholdProvider";
import { useSkin } from "@/providers/SkinProvider";
import useTickets from "@/providers/TicketsProvider";
import useToast from "@/providers/ToastProvider";
import { LANGUAGE_NAMES } from "@/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Share } from "react-native";

const HIDDEN_CODE = "••••••";

export type AccountPanel = "switch" | "qr" | "delete" | "credits" | "language" | "emailCode" | "guestName" | "theme";

const useAccount = () => {
  const skin = useSkin();
  const copy = skin.copy.account;
  const { user, isGuest, logout, deleteAccount } = useAuth();
  const { requireAccount } = useAccountGate();
  const { household, switchHousehold } = useHousehold();
  const { showToast } = useToast();
  const { counter } = useTickets();
  const [openPanel, setPanel] = useState<AccountPanel | null>(null);
  const needsEmailCode = !isGuest && !!user && !user.emailConfirmedAt;
  const askForEmailCode = () => {
    showToast(common.emailGate.title, "info");
    setPanel("emailCode");
  };
  const setOpenPanel = (panel: AccountPanel | null) => {
    if (isGuest && (panel === "qr" || panel === "switch")) {
      requireAccount("household");
      return;
    }
    if (needsEmailCode && (panel === "qr" || panel === "switch")) {
      askForEmailCode();
      return;
    }
    setPanel(panel);
  };
  const { panel: requestedPanel } = useLocalSearchParams<{ panel?: string }>();

  const [handledPanel, setHandledPanel] = useState<string | undefined>();

  if (requestedPanel !== handledPanel) {
    setHandledPanel(requestedPanel);
    if (requestedPanel === "emailCode" && needsEmailCode) setPanel("emailCode");
  }

  useEffect(() => {
    if (requestedPanel) router.setParams({ panel: undefined });
  }, [requestedPanel]);
  const { lang, choice } = useLanguage();
  const closePanel = useCallback(() => setPanel(null), []);

  const joinCode = (household?.joinCode ?? user?.household.joinCode) || HIDDEN_CODE;

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
    if (needsEmailCode) {
      askForEmailCode();
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
    hasThemes: skin.themes.length > 1,
    themeName: skin.theme?.name,
    openTheme: () => setOpenPanel("theme"),
    openGuestName: () => setOpenPanel("guestName"),
    openLooks: () => router.navigate("/looks"),
    looksLabel: skin.copy.prizes.sectionTitle,
    openNotifications: () => router.push("/notifications"),
    needsEmailCode,
    openEmailCode: () => setOpenPanel("emailCode"),
    languageName: choice ? LANGUAGE_NAMES[choice] : common.languageAuto(LANGUAGE_NAMES[lang]),
    openIconsSite,
    switchTo,
    replayOnboarding: () => router.push("/onboarding?intro=1&replay=1"),
    refineFoods: () => router.push("/onboarding?refine=1"),
  };
};

export type Account = ReturnType<typeof useAccount>;

export default useAccount;
