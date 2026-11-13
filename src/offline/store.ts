import db from "./db";
import { bundledCatalog } from "./bundledCatalog";
import { setFoodBanks } from "./foodNames";
import { hasRules, setRules } from "./rules";
import { exportGuestState, hasLearnedAnything, prizeEntries } from "./guest";
import { applyOp, toState } from "./reducer";
import { countStat, setStatsSource } from "./stats";
import type { Catalog, LocalState, Op, OpType, Snapshot, SyncResponse } from "./types";

const KEY_SNAPSHOT = "snapshot";
const KEY_HASH = "hash";
const KEY_ALIASES = "aliases";
const KEY_NEXT_TEMP = "nextTemp";
const KEY_OWNER = "owner";
const KEY_ENDED = "sessionEnded";
const KEY_GUEST = "guest";
const KEY_GUEST_STATE = "guestState";
const KEY_IMPORT_ID = "guestImportId";
const KEY_INTRO = "introPending";
const KEY_CATALOG = "catalog";
const CACHE_PREFIX = "http:";

const FIRST_TEMP_ID = -2;
const MAX_ATTEMPTS = 5;
const ID_FIELDS = ["foodId", "shopListId", "listId", "tempId"];

const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });

let loaded = false;
let base: Snapshot | null = null;
let hash: string | undefined;
let ops: Op[] = [];
let aliases: Record<string, number> = {};
let nextTemp = FIRST_TEMP_ID;
let owner: number | null = null;
let sessionEnded = false;
let guest = false;
let state: LocalState | null = null;
const listeners = new Set<() => void>();

const rebuild = () => {
  if (guest) return;
  if (!base) {
    state = null;
    return;
  }
  const next = toState(base);
  if (hasRules()) for (const op of ops) applyOp(next, op);
  state = next;
};

const load = () => {
  if (loaded) return;
  loaded = true;
  const pack = db.loadValue<Catalog>(KEY_CATALOG) ?? bundledCatalog();
  if (pack) {
    setFoodBanks(pack.foodBanks);
    setRules(pack.rules);
  }
  base = db.loadValue<Snapshot>(KEY_SNAPSHOT) ?? null;
  hash = db.loadValue<string>(KEY_HASH);
  aliases = db.loadValue<Record<string, number>>(KEY_ALIASES) ?? {};
  nextTemp = db.loadValue<number>(KEY_NEXT_TEMP) ?? FIRST_TEMP_ID;
  owner = db.loadValue<number>(KEY_OWNER) ?? null;
  sessionEnded = db.loadValue<boolean>(KEY_ENDED) ?? false;
  ops = db.loadOps();
  guest = db.loadValue<boolean>(KEY_GUEST) ?? false;
  if (guest) {
    const saved = db.loadValue<LocalState>(KEY_GUEST_STATE);
    state = saved ? { ...saved, runs: saved.runs ?? [] } : null;
    if (!state) guest = false;
    return;
  }
  rebuild();
};

const persistGuest = () => db.saveValue(KEY_GUEST_STATE, state);

const notify = () => listeners.forEach((listener) => listener());

const resolveId = (id: unknown) =>
  typeof id === "number" ? (aliases[String(id)] ?? id) : id;

const remap = (payload: Record<string, any>) => {
  const next = { ...payload };
  for (const field of ID_FIELDS) {
    if (field in next && field !== "tempId") next[field] = resolveId(next[field]);
  }
  if (Array.isArray(next.foodIds)) next.foodIds = next.foodIds.map(resolveId);
  return next;
};

export const subscribeStore = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const hasSession = () => {
  load();
  return state !== null && !sessionEnded && !guest;
};

export const isGuest = () => {
  load();
  return guest && state !== null;
};

export const isSessionEnded = () => {
  load();
  return sessionEnded && state !== null && !guest;
};

export const startGuest = (snapshot: Snapshot) => {
  wipe();
  guest = true;
  state = toState(snapshot);
  db.transaction(() => {
    db.saveValue(KEY_GUEST, true);
    db.saveValue(KEY_IMPORT_ID, uuid());
    db.saveValue(KEY_INTRO, true);
    persistGuest();
  });
  notify();
};

export const applyCatalog = (catalog: Catalog) => {
  load();
  const hadRules = hasRules();
  setFoodBanks(catalog.foodBanks);
  setRules(catalog.rules);
  if (!hadRules && hasRules() && !guest) {
    rebuild();
    notify();
  }
  if (!isGuest()) return;
  state!.prizes.prizes = prizeEntries(catalog.prizes, state!.prizes.prizes);
  persistGuest();
  notify();
};

export const isIntroPending = () => db.loadValue<boolean>(KEY_INTRO) === true;

export const consumeIntro = () => {
  db.saveValue(KEY_INTRO, false);
  notify();
};

export const hasGuestData = () => isGuest() && hasLearnedAnything(state!);

export const exportGuest = () => {
  if (!isGuest()) return undefined;
  return exportGuestState(state!, db.loadValue<string>(KEY_IMPORT_ID) ?? uuid());
};

export const getState = () => {
  load();
  return state;
};

export const getHash = () => {
  load();
  return hash;
};

export const pendingOps = (limit?: number) => {
  load();
  return limit === undefined ? [...ops] : ops.slice(0, limit);
};

export const pendingCount = () => {
  load();
  return ops.length;
};

export const allocateTempId = () => {
  load();
  const id = nextTemp;
  nextTemp -= 1;
  db.saveValue(KEY_NEXT_TEMP, nextTemp);
  return id;
};

export const resolveAlias = (id: number) => {
  load();
  return aliases[String(id)] ?? id;
};

let lastSuggested: number | null = null;

const recordStats = (type: OpType, payload: Record<string, any>, result: unknown, runsBefore: number, roundsBefore: number) => {
  if (type === "swipe") countStat("cards");
  if (type === "swipe.complete" && state!.playedAt.length > roundsBefore) countStat("rounds");
  if (type === "shop.buy" && lastSuggested !== null && Number(payload.foodId) === lastSuggested) {
    countStat("suggestionsTaken");
  }
  if (type === "shop.buy" || type === "shop.snooze") {
    lastSuggested = Array.isArray(result) && typeof result[0] === "number" ? result[0] : null;
  }
  if (state!.dashboard.shopLists.total > runsBefore) countStat("runs");
};

export const enqueue = (type: OpType, payload: Record<string, any>) => {
  load();
  if (!state) throw new Error("Offline store has no state");
  const runsBefore = state.dashboard.shopLists.total;
  const roundsBefore = state.playedAt.length;
  const op: Op = {
    id: uuid(),
    type,
    at: new Date().toISOString(),
    payload: remap(payload),
    attempts: 0,
  };
  if (guest) {
    const result = applyOp(state, op);
    persistGuest();
    recordStats(type, payload, result, runsBefore, roundsBefore);
    notify();
    return result;
  }
  db.insertOp(op);
  ops.push(op);
  const result = applyOp(state, op);
  recordStats(type, payload, result, runsBefore, roundsBefore);
  notify();
  return result;
};

export const applySyncResponse = (response: SyncResponse) => {
  load();
  const acked = new Set(response.acks.map((ack) => ack.id));
  aliases = { ...aliases, ...response.ids };
  const remaining = ops
    .filter((op) => !acked.has(op.id))
    .map((op) => ({ ...op, payload: remap(op.payload) }));
  const dropped: Op[] = [];

  if (response.retry) {
    const head = remaining[0];
    if (head) {
      head.attempts += 1;
      if (head.attempts >= MAX_ATTEMPTS) dropped.push(remaining.shift()!);
    }
  }

  db.transaction(() => {
    for (const op of ops) {
      if (acked.has(op.id)) db.deleteOp(op.id);
    }
    for (const op of dropped) db.deleteOp(op.id);
    for (const op of remaining) db.updateOp(op);
    db.saveValue(KEY_ALIASES, aliases);
    if (response.snapshot) {
      db.saveValue(KEY_SNAPSHOT, response.snapshot);
      db.saveValue(KEY_HASH, response.hash);
      db.saveValue(KEY_OWNER, response.snapshot.user.id);
    }
    if (sessionEnded) db.saveValue(KEY_ENDED, false);
  });

  ops = remaining;
  sessionEnded = false;
  if (response.snapshot) {
    base = response.snapshot;
    hash = response.hash;
    owner = response.snapshot.user.id;
  }
  rebuild();
  notify();
};

export const claimFor = (userId: number) => {
  load();
  if (owner !== null && owner !== userId) wipe();
};

export const endSession = () => {
  load();
  sessionEnded = true;
  db.saveValue(KEY_ENDED, true);
  notify();
};

export const forgetHousehold = () => {
  load();
  db.transaction(() => {
    db.saveValue(KEY_HASH, "");
    for (const op of ops) db.deleteOp(op.id);
  });
  hash = undefined;
  ops = [];
  rebuild();
};

export const wipe = () => {
  load();
  db.clear();
  base = null;
  hash = undefined;
  ops = [];
  aliases = {};
  nextTemp = FIRST_TEMP_ID;
  owner = null;
  sessionEnded = false;
  guest = false;
  state = null;
  notify();
};

export const saveCached = (key: string, value: unknown) => {
  db.saveValue(`${CACHE_PREFIX}${key}`, value);
};

export const loadCached = <T,>(key: string) => db.loadValue<T>(`${CACHE_PREFIX}${key}`);

export const saveValue = (key: string, value: unknown) => db.saveValue(key, value);

export const loadValue = <T,>(key: string) => db.loadValue<T>(key);

export const resetStoreForTests = () => {
  loaded = false;
  base = null;
  hash = undefined;
  ops = [];
  aliases = {};
  nextTemp = FIRST_TEMP_ID;
  owner = null;
  sessionEnded = false;
  guest = false;
  state = null;
  listeners.clear();
};

setStatsSource(() => {
  load();
  return { guest, state };
});
