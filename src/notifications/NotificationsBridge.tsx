import { getCatalog } from "@/offline/catalog";
import { choiceOf } from "@/offline/notifications";
import { getState, subscribeStore } from "@/offline/store";
import useAuth from "@/providers/AuthProvider";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { configureNotifications, onPermissionGranted, registerPushToken, scheduleReminders } from "./push";

const NO_PLAYS: string[] = [];
const playedAt = () => getState()?.playedAt ?? NO_PLAYS;

const openFrom = (response: Notifications.NotificationResponse | null) => {
  const url = response?.notification.request.content.data?.url;
  if (typeof url === "string" && url.startsWith("/")) router.push(url as never);
};

const NotificationsBridge = () => {
  const { user, isGuest } = useAuth();
  const plays = useSyncExternalStore(subscribeStore, playedAt, playedAt);
  const reminderEvent = getCatalog()?.notifications?.events.find((event) => event.id === "dailyReminder");
  const reminderChoice = reminderEvent && user ? choiceOf(user.notifications, reminderEvent, isGuest) : "none";
  const remind = reminderChoice === "push" || reminderChoice === "both";
  const lastPlay = plays[plays.length - 1] ?? "";
  const userId = user?.id;
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    configureNotifications();
    Notifications.getLastNotificationResponseAsync().then(openFrom).catch(() => {});
    const subscription = Notifications.addNotificationResponseReceivedListener(openFrom);
    const bump = () => setRefresh((count) => count + 1);
    const stopGrant = onPermissionGranted(bump);
    const appState = AppState.addEventListener("change", (state) => state === "active" && bump());
    return () => {
      subscription.remove();
      stopGrant();
      appState.remove();
    };
  }, []);

  useEffect(() => {
    if (userId === undefined || isGuest) return;
    registerPushToken().catch(() => {});
  }, [userId, isGuest, refresh]);

  useEffect(() => {
    if (userId === undefined) return;
    scheduleReminders(remind, playedAt()).catch(() => {});
  }, [userId, remind, lastPlay, refresh]);

  return null;
};

export default NotificationsBridge;
