import common from "@/i18n/common";
import { getCatalog } from "@/offline/catalog";
import { choiceOf } from "@/offline/notifications";
import type { NotificationChoice, NotificationEvent } from "@/offline/types";
import useAuth from "@/providers/AuthProvider";
import { registerPushToken, requestPermission } from "@/notifications/push";
import axios from "@/services/axios";
import { useState } from "react";
import { Linking } from "react-native";
import { UserType } from "@/types/model";

const toChoice = (email: boolean, push: boolean): NotificationChoice =>
  email && push ? "both" : email ? "email" : push ? "push" : "none";

const useNotificationSettings = () => {
  const { user, isGuest, mutateUser } = useAuth();
  const [pushBlocked, setPushBlocked] = useState(false);
  const [failedEvent, setFailedEvent] = useState<string | null>(null);
  const catalog = getCatalog()?.notifications;

  const rows = (catalog?.events ?? []).map((event: NotificationEvent) => {
    const choice = choiceOf(user?.notifications, event, isGuest);
    return {
      event,
      email: choice === "email" || choice === "both",
      push: choice === "push" || choice === "both",
      canEmail: !isGuest && event.channels.includes("email"),
      canPush: event.channels.includes("push"),
    };
  });

  const set = async (row: (typeof rows)[number], channel: "email" | "push", on: boolean) => {
    setFailedEvent(null);
    if (channel === "push" && on && !(await requestPermission().catch(() => false))) {
      setPushBlocked(true);
      return;
    }
    if (channel === "push" && on) setPushBlocked(false);
    const choice = toChoice(channel === "email" ? on : row.email, channel === "push" ? on : row.push);
    try {
      const res = await axios.put<UserType>("/me/notifications", { event: row.event.id, choice });
      await mutateUser(res.data);
      if (channel === "push" && on && !isGuest) registerPushToken().catch(() => {});
    } catch {
      setFailedEvent(row.event.id);
    }
  };

  return {
    isGuest,
    rows,
    required: isGuest ? [] : catalog?.alwaysEmail ?? [],
    set,
    pushBlocked,
    openPhoneSettings: () => Linking.openSettings().catch(() => {}),
    rowError: (eventId: string) => (failedEvent === eventId ? common.feedback.flippedBack : null),
  };
};

export default useNotificationSettings;
