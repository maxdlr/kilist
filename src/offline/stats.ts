import type { AxiosInstance } from "axios";
import { toLocalDay } from "./domain";
import db from "./db";
import type { LocalState } from "./types";

const KEY_INSTALL = "keep:installId";
const KEY_DAYS = "keep:statsDays";
const KEY_GATE_AT = "keep:lastGateAt";
const GATE_WINDOW_MS = 7 * 24 * 3600000;
const KEEP_DAYS = 31;

export type StatCounter =
  | "rounds"
  | "cards"
  | "runs"
  | "suggestionsTaken"
  | "errors"
  | "gatesHousehold"
  | "gatesVersus"
  | "signups"
  | "signupsAfterGate";

type DayStats = Partial<Record<StatCounter, number>> & {
  day: string;
  foods?: number;
  guest?: boolean;
  skin?: string;
  appVersion?: string;
  platform?: string;
};

let appInfo = { appVersion: "", platform: "" };
let source: () => { guest: boolean; state: LocalState | null } = () => ({ guest: true, state: null });

const loadValue = <T,>(key: string) => db.loadValue<T>(key);
const saveValue = (key: string, value: unknown) => db.saveValue(key, value);

export const setStatsSource = (next: typeof source) => {
  source = next;
};

const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    return (char === "x" ? random : (random & 0x3) | 0x8).toString(16);
  });

const installId = () => {
  const saved = loadValue<string>(KEY_INSTALL);
  if (saved) return saved;
  const id = uuid();
  saveValue(KEY_INSTALL, id);
  return id;
};

const today = () => toLocalDay(new Date(), new Date().getTimezoneOffset());

const days = () => loadValue<DayStats[]>(KEY_DAYS) ?? [];

const snapshotFields = () => {
  const { guest, state } = source();
  return {
    ...appInfo,
    guest: guest || !state,
    ...(state && {
      foods: state.foods.filter((food) => food.lists.length > 0).length,
      skin: state.user.skin ?? "",
    }),
  };
};

const touch = (update: (entry: DayStats) => void) => {
  try {
    const list = days();
    const day = today();
    let entry = list.find((item) => item.day === day);
    if (!entry) {
      entry = { day };
      list.push(entry);
    }
    update(entry);
    Object.assign(entry, snapshotFields());
    saveValue(KEY_DAYS, list.slice(-KEEP_DAYS));
  } catch {
    return;
  }
};

export const setAppInfo = (info: { appVersion: string; platform: string }) => {
  appInfo = info;
};

export const countStat = (counter: StatCounter, amount = 1) =>
  touch((entry) => {
    entry[counter] = (entry[counter] ?? 0) + amount;
  });

export const markActive = () => touch(() => undefined);

export const countGate = (feature: "household" | "versus") => {
  countStat(feature === "versus" ? "gatesVersus" : "gatesHousehold");
  saveValue(KEY_GATE_AT, Date.now());
};

export const countSignup = () => {
  const gateAt = loadValue<number>(KEY_GATE_AT);
  countStat("signups");
  if (gateAt && Date.now() - gateAt < GATE_WINDOW_MS) countStat("signupsAfterGate");
};

export const sendStats = async (client: AxiosInstance) => {
  const pending = days();
  if (pending.length === 0) return;
  try {
    await client.post("/stats", { installId: installId(), days: pending }, { network: true, timeout: 10000 } as object);
    const day = today();
    saveValue(KEY_DAYS, days().filter((entry) => entry.day >= day));
  } catch {
    return;
  }
};
