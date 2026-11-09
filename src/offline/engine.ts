import { mutate } from "swr";
import type { AxiosInstance } from "axios";
import {
  applySyncResponse,
  claimFor,
  endSession,
  forgetHousehold,
  getHash,
  hasSession,
  pendingCount,
  pendingOps,
  subscribeStore,
  wipe,
} from "./store";
import type { SyncResponse } from "./types";

const BATCH_SIZE = 100;
const WRITE_DEBOUNCE_MS = 250;
const SYNC_TIMEOUT_MS = 15000;
export const ONLINE_POLL_MS = 60000;
export const WAITING_POLL_MS = 15000;

export type SyncStatus = {
  waiting: boolean;
  pending: number;
  online: boolean;
};

let client: AxiosInstance | null = null;
let running: Promise<void> | null = null;
let rerun = false;
let debounce: ReturnType<typeof setTimeout> | null = null;
let status: SyncStatus = { waiting: false, pending: 0, online: true };
let sessionEndedHandler: (() => void) | null = null;
const statusListeners = new Set<() => void>();

const setStatus = (next: Partial<SyncStatus>) => {
  const merged = { ...status, ...next };
  if (
    merged.waiting === status.waiting &&
    merged.pending === status.pending &&
    merged.online === status.online
  ) {
    return;
  }
  status = merged;
  statusListeners.forEach((listener) => listener());
};

export const getSyncStatus = () => status;

export const subscribeStatus = (listener: () => void) => {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
};

export const setOnline = (online: boolean) => setStatus({ online });

export const onSessionEnded = (handler: (() => void) | null) => {
  sessionEndedHandler = handler;
};

export const setSyncClient = (axios: AxiosInstance) => {
  client = axios;
};

const refreshScreens = () =>
  mutate((key) => typeof key === "object" && key !== null && "url" in key);

const isNetworkFailure = (error: any) => !error?.response;

const pass = async () => {
  if (!client) return;
  let more = true;
  while (more) {
    const ops = pendingOps(BATCH_SIZE);
    const { data } = await client.post<SyncResponse>(
      "/sync",
      {
        ops: ops.map(({ attempts: _attempts, ...op }) => op),
        sentAt: new Date().toISOString(),
        knownHash: getHash(),
      },
      { timeout: SYNC_TIMEOUT_MS, network: true } as any,
    );
    applySyncResponse(data);
    if (data.retry) throw new Error("Sync operation needs a retry");
    more = pendingCount() > 0 && data.acks.length > 0;
  }
};

const run = async () => {
  try {
    do {
      rerun = false;
      await pass();
    } while (rerun);
    setStatus({ waiting: false, pending: pendingCount() });
  } catch (error: any) {
    if (error?.response?.status === 401) {
      setStatus({ waiting: false, pending: pendingCount() });
      if (hasSession()) {
        endSession();
        sessionEndedHandler?.();
      }
      return;
    }
    if (!isNetworkFailure(error) && error?.response?.status < 500) {
      console.error("Sync failed", error?.response?.status);
    }
    setStatus({ waiting: hasSession(), pending: pendingCount() });
    return;
  }
  await refreshScreens();
};

export const syncNow = (): Promise<void> => {
  if (debounce) {
    clearTimeout(debounce);
    debounce = null;
  }
  if (running) {
    rerun = true;
    return running;
  }
  running = run().finally(() => {
    running = null;
  });
  return running;
};

export const requestSync = () => {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    debounce = null;
    syncNow();
  }, WRITE_DEBOUNCE_MS);
};

export const signedIn = (userId: number) => {
  claimFor(userId);
  return syncNow();
};

export const signedOut = () => {
  wipe();
  setStatus({ waiting: false, pending: 0 });
};

export const householdChanged = async () => {
  forgetHousehold();
  await syncNow();
};

let storeSubscribed = false;

export const watchStore = () => {
  if (storeSubscribed) return;
  storeSubscribed = true;
  let known = pendingCount();
  subscribeStore(() => {
    const count = pendingCount();
    setStatus({ pending: count });
    if (count > known) requestSync();
    known = count;
    mutate(
      (key) => {
        const url = (key as { url?: unknown } | null)?.url;
        return typeof url === "string" && !url.includes("versus/") && !url.includes("admin");
      },
    );
  });
};
