import NetInfo from "@react-native-community/netinfo";
import { AppState } from "react-native";
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

const startSync = () => {
  if (started) return;
  started = true;
  watchStore();

  NetInfo.addEventListener((state) => {
    const online = state.isConnected !== false && state.isInternetReachable !== false;
    const wasOffline = !getSyncStatus().online;
    setOnline(online);
    if (online && wasOffline && hasSession()) syncNow();
  });

  AppState.addEventListener("change", (next) => {
    if (next === "active" && hasSession()) syncNow();
  });

  if (hasSession()) syncNow();
  schedule();
};

export default startSync;
