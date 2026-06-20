/**
 * SQLite schema as an ordered list of migrations (PROJECT.md §16).
 *
 * Each entry is one migration step; the array index + 1 is the resulting
 * `PRAGMA user_version`. Append new migrations — never edit a shipped one.
 *
 * Time-series data lives here (logs, check-ins). Settings and the active plan
 * stay in Zustand/AsyncStorage. Economy ledger + inventory arrive in Phase 4.
 */
export const MIGRATIONS: string[] = [
  // v1 — initial logging tables
  `
  CREATE TABLE IF NOT EXISTS cigarette_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    trigger_category TEXT,
    note TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_cigarette_timestamp ON cigarette_log (timestamp);

  CREATE TABLE IF NOT EXISTS craving_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    resisted INTEGER NOT NULL,
    trigger_category TEXT,
    intensity INTEGER,
    note TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_craving_timestamp ON craving_log (timestamp);

  CREATE TABLE IF NOT EXISTS check_in (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    mood INTEGER,
    note TEXT
  );
  `,
];
