import ActionPanel, { type ActionPanelRequest } from "@/components/elements/ActionPanel";
import { toLocalDay } from "@/offline/domain";
import { countGate } from "@/offline/stats";
import { getState, isGuest, loadValue, saveValue } from "@/offline/store";
import useAuth from "@/providers/AuthProvider";
import { useSkin } from "@/providers/SkinProvider";
import { router, usePathname } from "expo-router";
import React, { createContext, ReactNode, useCallback, useState } from "react";

export type GatedFeature = "household" | "versus";

const REMINDER_KEY = "guestReminderAt";
const REMINDER_AFTER_DAYS = 7;
const REMINDER_AGAIN_MS = 30 * 24 * 3600000;

const AccountGateContext = createContext<{ requireAccount: (feature: GatedFeature) => void }>({
  requireAccount: () => {},
});

const playedDays = () => {
  const tzOffset = new Date().getTimezoneOffset();
  return new Set((getState()?.playedAt ?? []).map((at) => toLocalDay(at, tzOffset))).size;
};

const reminderAllowed = () => {
  if (!isGuest() || playedDays() < REMINDER_AFTER_DAYS) return false;
  const shownAt = loadValue<number>(REMINDER_KEY);
  return !(shownAt && Date.now() - shownAt < REMINDER_AGAIN_MS);
};

export const AccountGateProvider = ({ children }: { children: ReactNode }) => {
  const skin = useSkin();
  const copy = skin.copy.guest;
  const { isGuest: guest } = useAuth();
  const pathname = usePathname();
  const [request, setRequest] = useState<ActionPanelRequest | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const ask = useCallback(
    (title: string, message: string) =>
      setRequest({
        title,
        message,
        cancelLabel: copy.later,
        actions: [
          { label: copy.login, onPress: () => router.push("/login") },
          { label: copy.create, onPress: () => router.push("/login?mode=signup") },
        ],
      }),
    [copy],
  );

  const requireAccount = useCallback(
    (feature: GatedFeature) => {
      countGate(feature);
      return feature === "versus"
        ? ask(copy.versusTitle, copy.versusLine)
        : ask(copy.householdTitle, copy.householdLine);
    },
    [ask, copy],
  );

  const reminderDue = guest && !dismissed && reminderAllowed();

  const reminder: ActionPanelRequest = {
    title: copy.reminderTitle,
    message: copy.reminderLine,
    cancelLabel: copy.later,
    actions: [{ label: copy.create, onPress: () => router.push("/login?mode=signup") }],
  };

  const close = () => {
    if (!request && reminderDue) {
      saveValue(REMINDER_KEY, Date.now());
      setDismissed(true);
    }
    setRequest(null);
  };

  return (
    <AccountGateContext.Provider value={{ requireAccount }}>
      {children}
      <ActionPanel
        request={request ?? (reminderDue && !pathname.startsWith("/login") ? reminder : null)}
        onClose={close}
      />
    </AccountGateContext.Provider>
  );
};

export const useAccountGate = () => React.useContext(AccountGateContext);
