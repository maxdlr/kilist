import common from "@/i18n/common";
import db from "@/offline/db";
import axios from "@/services/axios";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { reminderDates } from "./reminder";

const KEY_TOKEN = "pushToken";
export const CHANNEL_ID = "default";

let configured = false;
const grantListeners = new Set<() => void>();

export const onPermissionGranted = (listener: () => void) => {
  grantListeners.add(listener);
  return () => {
    grantListeners.delete(listener);
  };
};

export const configureNotifications = async () => {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Kilist",
      importance: AndroidImportance.DEFAULT,
    });
  }
};

export const canAskPermission = async () => {
  const current = await Notifications.getPermissionsAsync();
  return !current.granted && current.canAskAgain;
};

export const requestPermission = async () => {
  await configureNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const granted = (await Notifications.requestPermissionsAsync()).granted;
  if (granted) grantListeners.forEach((listener) => listener());
  return granted;
};

const projectId = () =>
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ?? Constants.easConfig?.projectId;

export const registerPushToken = async () => {
  if (!(await Notifications.getPermissionsAsync()).granted) return false;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() });
  await axios.post("/me/push-token", { token, platform: Platform.OS }, { network: true } as object);
  db.saveValue(KEY_TOKEN, token);
  return true;
};

export const unregisterPushToken = async () => {
  const token = db.loadValue<string>(KEY_TOKEN);
  if (!token) return;
  try {
    await axios.delete("/me/push-token", { data: { token }, network: true } as object);
  } catch {}
  db.saveValue(KEY_TOKEN, null);
};

let reminderQueue: Promise<void> = Promise.resolve();

const replaceReminders = async (enabled: boolean, playedAt: string[]) => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((entry) => entry.content.data?.event === "dailyReminder")
      .map((entry) => Notifications.cancelScheduledNotificationAsync(entry.identifier)),
  );
  if (!enabled || !(await Notifications.getPermissionsAsync()).granted) return;
  for (const date of reminderDates(new Date(), playedAt)) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: common.notifications.reminder.title,
        body: common.notifications.reminder.body,
        data: { url: "/swipe", event: "dailyReminder" },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: CHANNEL_ID },
    });
  }
};

export const scheduleReminders = (enabled: boolean, playedAt: string[]) => {
  reminderQueue = reminderQueue.then(() => replaceReminders(enabled, playedAt)).catch(() => {});
  return reminderQueue;
};
