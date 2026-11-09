import { useSyncExternalStore } from "react";
import { getSyncStatus, subscribeStatus } from "./engine";

const useSyncStatus = () => useSyncExternalStore(subscribeStatus, getSyncStatus, getSyncStatus);

export default useSyncStatus;
