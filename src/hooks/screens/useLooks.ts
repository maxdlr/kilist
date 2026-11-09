import { useSkinSwitch } from "@/providers/SkinProvider";
import useTickets, { PrizeType } from "@/providers/TicketsProvider";
import useToast from "@/providers/ToastProvider";
import { useAccountGate } from "@/providers/AccountGateProvider";
import useAuth from "@/providers/AuthProvider";
import { findSkin, SKINS } from "@/skins";
import type { Skin } from "@/skins/types";
import { useState } from "react";

export const STORE_PRICE = "€1.99";

export type LookState = "current" | "owned" | "unlockable" | "locked";

export type Look = {
  prize: PrizeType;
  skin: Skin;
  state: LookState;
  missing: number;
  wearableAnyway: boolean;
};

const ORDER: LookState[] = ["current", "owned", "unlockable", "locked"];

const useLooks = () => {
  const { skin, setSkin } = useSkinSwitch();
  const { counter, redeem } = useTickets();
  const { showToast } = useToast();
  const { isGuest } = useAuth();
  const { requireAccount } = useAccountGate();
  const needsAccount = (look: Look) => isGuest && look.skin.id === "versus";
  const [busy, setBusy] = useState<string | null>(null);
  const copy = skin.copy.prizes;
  const balance = counter?.balance ?? 0;

  const looks: Look[] = (counter?.prizes ?? [])
    .filter((prize) => SKINS.some((known) => known.id === prize.skin))
    .map((prize) => {
      const look = findSkin(prize.skin);
      const state: LookState =
        look.id === skin.id
          ? "current"
          : prize.owned || prize.price === 0
            ? "owned"
            : balance >= prize.price
              ? "unlockable"
              : "locked";
      return {
        prize,
        skin: look,
        state,
        missing: Math.max(0, prize.price - balance),
        wearableAnyway: prize.wearable && (state === "unlockable" || state === "locked"),
      };
    })
    .sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state));

  const run = async (id: string, task: () => Promise<boolean>) => {
    if (busy) return;
    setBusy(id);
    try {
      return await task();
    } finally {
      setBusy(null);
    }
  };

  const wear = (look: Look) =>
    needsAccount(look) ? requireAccount("versus") : run(look.prize.id, async () => {
      const ok = await setSkin(look.skin.id);
      if (!ok) showToast(copy.failed);
      return ok;
    });

  const unlock = (look: Look) =>
    needsAccount(look) ? requireAccount("versus") : run(look.prize.id, async () => {
      const ok = await redeem(look.prize.id);
      showToast(ok ? copy.redeemed(look.skin.name) : copy.failed, ok ? "success" : "error");
      return ok;
    });

  const buy = () => showToast(copy.storeSoon, "info");
  const earnMore = () => showToast(copy.earnHint, "info");

  return { balance, looks, busy, wear, unlock, buy, earnMore, price: STORE_PRICE };
};

export type Looks = ReturnType<typeof useLooks>;

export default useLooks;
