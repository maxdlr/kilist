import type { OfflineDb } from "./db";
import type { Op } from "./types";

export const createMemoryDb = (): OfflineDb => {
  let ops: Op[] = [];
  const values = new Map<string, string>();

  return {
    loadOps: () => ops.map((op) => JSON.parse(JSON.stringify(op))),
    loadValue: <T,>(key: string) => {
      const value = values.get(key);
      return value === undefined ? undefined : (JSON.parse(value) as T);
    },
    saveValue: (key, value) => {
      values.set(key, JSON.stringify(value));
    },
    deleteValues: (prefix) => {
      for (const key of [...values.keys()]) {
        if (key.startsWith(prefix)) values.delete(key);
      }
    },
    insertOp: (op) => {
      ops.push(JSON.parse(JSON.stringify(op)));
    },
    updateOp: (op) => {
      ops = ops.map((entry) => (entry.id === op.id ? JSON.parse(JSON.stringify(op)) : entry));
    },
    deleteOp: (id) => {
      ops = ops.filter((entry) => entry.id !== id);
    },
    clear: () => {
      ops = [];
      for (const key of [...values.keys()]) {
        if (!key.startsWith("keep:")) values.delete(key);
      }
    },
    transaction: (work) => work(),
  };
};
