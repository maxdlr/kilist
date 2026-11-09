import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
import type { AxiosInstance } from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { refreshCatalog } from "./catalog";
import { countStat, markActive, sendStats, setAppInfo } from "./stats";
import { getSyncStatus, ONLINE_POLL_MS, setOnline, syncNow, WAITING_POLL_MS, watchStore } from "./engine";
import { hasSession } from "./store";

let started = false;

const schedule = () => {
  const { waiting } = getSyncStatus();
  setTimeout(() => {
    if (AppState.currentState === "active" && hasSession()) syncNow();
    schedule();
  }, waiting ? WAITING_POLL_MS : ONLINE_POLL_MS);
};

const startSync = (client: AxiosInstance) => {
  if (started) return;
  started = true;
  watchStore();
  setAppInfo({ appVersion: Constants.expoConfig?.version ?? "", platform: Platform.OS });
  markActive();
  refreshCatalog(client);
  sendStats(client);
  const handler = (globalThis as any).ErrorUtils?.getGlobalHandler?.();
  (globalThis as any).ErrorUtils?.setGlobalHandler?.((error: unknown, fatal?: boolean) => {
    countStat("errors");
    handler?.(error, fatal);
  });

  NetInfo.addEventListener((state) => {
    const online = state.isConnected !== false && state.isInternetReachable !== false;
    const wasOffline = !getSyncStatus().online;
    setOnline(online);
    if (online && wasOffline) {
      refreshCatalog(client);
      sendStats(client);
    }
    if (online && wasOffline && hasSession()) syncNow();
  });

  AppState.addEventListener("change", (next) => {
    if (next === "active") {
      markActive();
      sendStats(client);
    }
    if (next === "active" && hasSession()) syncNow();
  });

  if (hasSession()) syncNow();
  schedule();
};

export default startSync;
