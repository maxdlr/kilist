import * as SQLite from "expo-sqlite";
import type { Op } from "./types";

export type OfflineDb = {
  loadOps: () => Op[];
  loadValue: <T>(key: string) => T | undefined;
  saveValue: (key: string, value: unknown) => void;
  deleteValues: (prefix: string) => void;
  insertOp: (op: Op) => void;
  updateOp: (op: Op) => void;
  deleteOp: (id: string) => void;
  clear: () => void;
  transaction: (work: () => void) => void;
};

let database: SQLite.SQLiteDatabase | null = null;

const open = () => {
  if (database) return database;
  database = SQLite.openDatabaseSync("kilist-offline.db");
  database.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS outbox (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      id TEXT NOT NULL UNIQUE,
      body TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return database;
};

const db: OfflineDb = {
  loadOps: () =>
    open()
      .getAllSync<{ body: string }>("SELECT body FROM outbox ORDER BY seq ASC")
      .map((row) => JSON.parse(row.body) as Op),
  loadValue: <T,>(key: string) => {
    const row = open().getFirstSync<{ value: string }>("SELECT value FROM kv WHERE key = ?", key);
    return row ? (JSON.parse(row.value) as T) : undefined;
  },
  saveValue: (key, value) => {
    open().runSync(
      "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      key,
      JSON.stringify(value),
    );
  },
  deleteValues: (prefix) => {
    open().runSync("DELETE FROM kv WHERE key LIKE ?", `${prefix}%`);
  },
  insertOp: (op) => {
    open().runSync("INSERT INTO outbox (id, body) VALUES (?, ?)", op.id, JSON.stringify(op));
  },
  updateOp: (op) => {
    open().runSync("UPDATE outbox SET body = ? WHERE id = ?", JSON.stringify(op), op.id);
  },
  deleteOp: (id) => {
    open().runSync("DELETE FROM outbox WHERE id = ?", id);
  },
  clear: () => {
    open().execSync("DELETE FROM outbox; DELETE FROM kv WHERE key NOT LIKE 'keep:%';");
  },
  transaction: (work) => {
    open().withTransactionSync(work);
  },
};

export default db;
