import useAuth from "@/providers/AuthProvider";
import useHousehold from "@/providers/HouseholdProvider";
import { useSkin } from "@/providers/SkinProvider";
import useTickets from "@/providers/TicketsProvider";
import useToast from "@/providers/ToastProvider";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, Share } from "react-native";

export type AccountPanel = "switch" | "qr" | "delete" | "prizes";

const useAccount = () => {
  const skin = useSkin();
  const copy = skin.copy.account;
  const { user, logout, deleteAccount } = useAuth();
  const { household, switchHousehold } = useHousehold();
  const { showToast } = useToast();
  const { counter } = useTickets();
  const [openPanel, setOpenPanel] = useState<AccountPanel | null>(null);
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
        message: `Join my household on Kilist with this code: ${joinCode}`,
      });
    } catch {
      showToast("Couldn't open the share menu");
    }
  };

  const openCredits = async () => {
    try {
      await Linking.openURL("https://icons8.com");
    } catch {
      showToast("Couldn't open the link");
    }
  };

  const switchTo: typeof switchHousehold = async (choice) => {
    const success = await switchHousehold(choice);
    if (success) showToast("Household switched", "info");
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
    openCredits,
    switchTo,
    suggestFoods: () => router.push("/onboarding"),
  };
};

export type Account = ReturnType<typeof useAccount>;

export default useAccount;
