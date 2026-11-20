import common from "@/i18n/common";
import { useAccountGate } from "@/providers/AccountGateProvider";
import useAuth from "@/providers/AuthProvider";
import useHousehold from "@/providers/HouseholdProvider";
import { useSkin } from "@/providers/SkinProvider";
import useTickets from "@/providers/TicketsProvider";
import { useReportFeedback } from "@/providers/FeedbackStore";
import useMark from "@/providers/MarkProvider";
import { LANGUAGE_NAMES } from "@/i18n";
import { useLanguage } from "@/providers/LanguageProvider";
import { ACCOUNT_LINK_PANELS } from "@/notifications/actions";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Share } from "react-native";

const HIDDEN_CODE = "••••••";

export type AccountPanel = "switch" | "qr" | "delete" | "credits" | "language" | "emailCode" | "name" | "householdName" | "theme" | "notifications";

const useAccount = () => {
  const skin = useSkin();
  const { user, isGuest, logout } = useAuth();
  const { requireAccount } = useAccountGate();
  const { household, switchHousehold } = useHousehold();
  const report = useReportFeedback();
  const { mark } = useMark();
  const { counter } = useTickets();
  const [openPanel, setPanel] = useState<AccountPanel | null>(null);
  const needsEmailCode = !isGuest && !!user && !user.emailConfirmedAt;
  const askForEmailCode = () => setPanel("emailCode");
  const setOpenPanel = (panel: AccountPanel | null) => {
    if (isGuest && (panel === "qr" || panel === "switch" || panel === "householdName")) {
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
    if ((ACCOUNT_LINK_PANELS as readonly string[]).includes(requestedPanel ?? "")) {
      setPanel(requestedPanel as AccountPanel);
    }
  }

  useEffect(() => {
    if (requestedPanel) router.setParams({ panel: undefined });
  }, [requestedPanel]);
  const { choice } = useLanguage();
  const closePanel = useCallback(() => setPanel(null), []);

  const joinCode = (household?.joinCode ?? user?.household.joinCode) || HIDDEN_CODE;

  const logOut = async () => {
    const failed = await logout();
    if (!failed) {
      report("account", null);
      router.replace("/");
      return;
    }
    report("account", {
      tone: "error",
      title: common.feedback.logoutFailed,
      body: failed.message,
      action: { label: common.feedback.retry, onPress: logOut },
    });
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
      report("account", null);
    } catch {
      report("account", {
        tone: "error",
        title: common.feedback.shareFallback,
        body: common.feedback.shareFallbackLine,
        action: {
          label: common.feedback.showQr,
          onPress: () => {
            report("account", null);
            setOpenPanel("qr");
          },
        },
      });
    }
  };

  const openIconsSite = async () => {
    try {
      await Linking.openURL("https://icons8.com");
      report("account", null);
    } catch {
      report("account", { tone: "error", title: common.feedback.linkFallback });
    }
  };

  const switchTo: typeof switchHousehold = async (choice) => {
    const failed = await switchHousehold(choice);
    if (!failed) mark("done", common.householdSwitched);
    return failed;
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
    logOut,
    shareCode,
    openCredits: () => setOpenPanel("credits"),
    openLanguage: () => setOpenPanel("language"),
    hasThemes: skin.themes.length > 1,
    themeName: skin.theme?.name,
    openTheme: () => setOpenPanel("theme"),
    openName: () => setOpenPanel("name"),
    openHouseholdName: () => setOpenPanel("householdName"),
    openLooks: () => router.navigate("/looks"),
    looksLabel: skin.copy.prizes.sectionTitle,
    openNotifications: () => setOpenPanel("notifications"),
    needsEmailCode,
    openEmailCode: () => setOpenPanel("emailCode"),
    languageName: choice ? LANGUAGE_NAMES[choice] : common.languagePhone,
    openIconsSite,
    switchTo,
    replayOnboarding: () => router.push("/onboarding?intro=1&replay=1"),
    refineFoods: () => router.push("/onboarding?refine=1"),
  };
};

export type Account = ReturnType<typeof useAccount>;

export default useAccount;
