import { useSkinSwitch } from "@/providers/SkinProvider";
import useTickets, { fundsFor, PrizeType } from "@/providers/TicketsProvider";
import type { Feedback } from "@/components/elements/Feedback";
import common from "@/i18n/common";
import useMark from "@/providers/MarkProvider";
import { useAccountGate } from "@/providers/AccountGateProvider";
import useAuth from "@/providers/AuthProvider";
import { findSkin, SKINS } from "@/skins";
import type { Skin } from "@/skins/types";
import { type Href, router } from "expo-router";
import { useState } from "react";

export const STORE_PRICE = "€1.99";

export type LookState = "current" | "owned" | "unlockable" | "locked" | "account";

export type Look = {
  prize: PrizeType;
  skin: Skin;
  state: LookState;
  missing: number;
  funds: number;
  progress: number;
  wearableAnyway: boolean;
};

const ORDER: LookState[] = ["current", "owned", "unlockable", "locked", "account"];

const useLooks = () => {
  const { skin, setSkin } = useSkinSwitch();
  const { counter, redeem } = useTickets();
  const { mark } = useMark();
  const [problems, setProblems] = useState<Record<string, Feedback>>({});
  const [hint, setHint] = useState<{ id: string; text: string } | null>(null);
  const { isGuest } = useAuth();
  const { requireAccount } = useAccountGate();
  const needsAccount = (look: Look) => isGuest && !!look.prize.accountOnly;
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
            : isGuest && prize.accountOnly
              ? "account"
            : fundsFor(counter, prize) >= prize.price
              ? "unlockable"
              : "locked";
      const funds = fundsFor(counter, prize);
      return {
        prize,
        skin: look,
        state,
        missing: Math.max(0, prize.price - funds),
        funds: Math.min(funds, prize.price),
        progress: prize.price > 0 ? Math.min(1, funds / prize.price) : 1,
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

  const settle = (look: Look, problem: Feedback | null) =>
    setProblems((current) => {
      const next = { ...current };
      delete next[look.prize.id];
      if (problem) next[look.prize.id] = problem;
      return next;
    });

  const wear = (look: Look) =>
    needsAccount(look) ? requireAccount("versus") : run(look.prize.id, async () => {
      setHint(null);
      const ok = await setSkin(look.skin.id);
      settle(look, ok ? null : { tone: "error", title: common.feedback.wearFailed(look.skin.name), body: common.unexpected });
      return ok;
    });

  const unlock = (look: Look) =>
    needsAccount(look) ? requireAccount("versus") : run(look.prize.id, async () => {
      setHint(null);
      const ok = await redeem(look.prize.id);
      settle(
        look,
        ok ? null : { tone: "error", title: common.feedback.unlockFailed(look.skin.name), body: common.feedback.pointsKept },
      );
      if (ok) mark("done", copy.redeemed(look.skin.name));
      return ok;
    });

  const buy = (look: Look) => setHint({ id: look.prize.id, text: copy.storeSoon });
  const earnMore = (look: Look) => setHint({ id: look.prize.id, text: copy.earnHint });
  const preview = (look: Look) => router.navigate(`/look-preview?skin=${look.skin.id}` as Href);

  return {
    balance,
    looks,
    busy,
    wear,
    unlock,
    buy,
    earnMore,
    preview,
    price: STORE_PRICE,
    problemOf: (look: Look) => problems[look.prize.id] ?? null,
    hintOf: (look: Look) => (hint?.id === look.prize.id ? hint.text : null),
  };
};

export type Looks = ReturnType<typeof useLooks>;

export default useLooks;
