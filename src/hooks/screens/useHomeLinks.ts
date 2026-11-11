import common from "@/i18n/common";
import useAuth from "@/providers/AuthProvider";
import { useSkin } from "@/providers/SkinProvider";
import useTickets, { fundsFor } from "@/providers/TicketsProvider";
import { findSkin } from "@/skins";
import { router } from "expo-router";

const useHomeLinks = () => {
  const { user, isGuest } = useAuth();
  const { counter } = useTickets();
  const skin = useSkin();
  const T = common.home;

  const needsEmailCode = !isGuest && !!user && !user.emailConfirmedAt;
  const balance = counter?.balance ?? 0;
  const prizes = (counter?.prizes ?? [])
    .filter((prize) => !prize.owned && prize.price > 0)
    .sort((a, b) => Number(!!a.accountOnly) - Number(!!b.accountOnly) || a.price - b.price)
    .map((prize) => {
      const look = findSkin(prize.skin);
      const locked = isGuest && !!prize.accountOnly;
      const funds = fundsFor(counter, prize);
      return {
        id: prize.id,
        name: look.name,
        line: T.teasers[prize.skin] ?? look.tagline,
        status: locked
          ? skin.copy.prizes.needsAccount
          : funds >= prize.price
            ? skin.copy.prizes.redeem(prize.price)
            : skin.copy.prizes.progress(funds, prize.price),
        progress: locked ? 0 : Math.min(1, funds / prize.price),
        open: () => (locked ? router.push("/login?mode=signup") : router.navigate("/looks")),
      };
    });

  return {
    isAdmin: user?.type === "admin",
    prizes,
    prizesTitle: skin.copy.prizes.sectionTitle,
    balanceLabel: /\D/.test(skin.copy.tickets.balance(balance)) ? skin.copy.tickets.balance(balance) : skin.copy.prizes.balance(balance),
    openPrizes: () => router.navigate("/looks"),
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
