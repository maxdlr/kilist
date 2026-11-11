import common from "@/i18n/common";
import useAuth from "@/providers/AuthProvider";
import { useSkin } from "@/providers/SkinProvider";
import useTickets from "@/providers/TicketsProvider";
import { findSkin } from "@/skins";
import { router } from "expo-router";

const useHomeLinks = () => {
  const { user, isGuest } = useAuth();
  const { counter, nextPrize, nextPrizeFunds } = useTickets();
  const skin = useSkin();
  const T = common.home;

  const needsEmailCode = !isGuest && !!user && !user.emailConfirmedAt;
  const balance = counter?.balance ?? 0;
  const prizeName = nextPrize ? findSkin(nextPrize.skin).name : null;
  const missing = nextPrize ? Math.max(0, nextPrize.price - nextPrizeFunds) : 0;

  return {
    isAdmin: user?.type === "admin",
    prize: {
      balance,
      label: /\D/.test(skin.copy.tickets.balance(balance)) ? skin.copy.tickets.balance(balance) : skin.copy.prizes.balance(balance),
      detail: prizeName ? (missing > 0 ? T.toPrize(missing, prizeName) : T.prizeReady(prizeName)) : null,
      progress: nextPrize && nextPrize.price > 0 ? Math.min(1, nextPrizeFunds / nextPrize.price) : 0,
      open: () => router.navigate("/account"),
    },
    notice: isGuest
      ? { label: T.createAccount, open: () => router.push("/login?mode=signup") }
      : needsEmailCode
        ? { label: T.confirmEmail, open: () => router.navigate("/account?panel=emailCode") }
        : null,
    openInventory: () => router.navigate("/inventory"),
    openAccount: () => router.navigate("/account"),
    openAdmin: () => router.navigate("/admin"),
  };
};

export type HomeLinks = ReturnType<typeof useHomeLinks>;

export default useHomeLinks;
