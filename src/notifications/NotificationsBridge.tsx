import { getCatalog } from "@/offline/catalog";
import { choiceOf } from "@/offline/notifications";
import { getState, subscribeStore } from "@/offline/store";
import useAuth from "@/providers/AuthProvider";
import * as Notifications from "expo-notifications";
import { useEffect, useState, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { useLanguage } from "@/providers/LanguageProvider";
import { openNewsUrl } from "./actions";
import {
  configureNotifications,
  onPermissionGranted,
  registerGuestPushToken,
  registerPushToken,
  scheduleReminders,
} from "./push";

const NO_PLAYS: string[] = [];
const playedAt = () => getState()?.playedAt ?? NO_PLAYS;

const openFrom = (response: Notifications.NotificationResponse | null) => {
  const url = response?.notification.request.content.data?.url;
  if (typeof url === "string") openNewsUrl(url);
};

const NotificationsBridge = () => {
  const { user, isGuest } = useAuth();
  const plays = useSyncExternalStore(subscribeStore, playedAt, playedAt);
  const events = getCatalog()?.notifications?.events;
  const reminderEvent = events?.find((event) => event.id === "dailyReminder");
  const newsEvent = events?.find((event) => event.id === "productNews");
  const newsChoice = newsEvent && user ? choiceOf(user.notifications, newsEvent, isGuest) : "none";
  const news = newsChoice === "push" || newsChoice === "both";
  const { lang } = useLanguage();
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
    if (userId === undefined) return;
    (isGuest ? registerGuestPushToken(news) : registerPushToken()).catch(() => {});
  }, [userId, isGuest, news, lang, refresh]);

  useEffect(() => {
    if (userId === undefined) return;
    scheduleReminders(remind, playedAt()).catch(() => {});
  }, [userId, remind, lastPlay, refresh]);

  return null;
};

export default NotificationsBridge;
