/** Cigarette log repository (PROJECT.md §16). Thin SQLite I/O. */
import type { TriggerCategory } from '@/types/domain';
import { nowISO, shiftLocalISO } from '@/utils/date';
import type { DailyCount } from '@/utils/series';

import { getDb } from '../db';

export interface CigaretteRow {
  id: number;
  timestamp: string;
  trigger_category: string | null;
  note: string | null;
  shared: number;
  gifted: number;
}

/** Every cigarette, newest first — for the manual history view. */
export async function getAllCigarettes(): Promise<CigaretteRow[]> {
  const db = await getDb();
  return db.getAllAsync<CigaretteRow>(
    'SELECT * FROM cigarette_log ORDER BY timestamp DESC, id DESC',
  );
}

export async function addCigarette(input?: {
  timestamp?: string;
  trigger?: TriggerCategory;
  note?: string;
  /** Smoked only partially (shared) → lighter health impact. */
  shared?: boolean;
  /** Someone gave it (gifted) → no money impact. */
  gifted?: boolean;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO cigarette_log (timestamp, trigger_category, note, shared, gifted) VALUES (?, ?, ?, ?, ?)',
    input?.timestamp ?? nowISO(),
    input?.trigger ?? null,
    input?.note ?? null,
    input?.shared ? 1 : 0,
    input?.gifted ? 1 : 0,
  );
}

export async function countCigarettesOnDate(dateISO: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM cigarette_log WHERE substr(timestamp, 1, 10) = ?',
    dateISO,
  );
  return row?.c ?? 0;
}

/** Sparse per-day counts between two ISO dates (inclusive). Missing days omitted. */
export async function getDailyCigaretteCounts(
  fromISO: string,
  toISO: string,
): Promise<DailyCount[]> {
  const db = await getDb();
  return db.getAllAsync<DailyCount>(
    `SELECT substr(timestamp, 1, 10) AS date, COUNT(*) AS count
       FROM cigarette_log
      WHERE substr(timestamp, 1, 10) BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date`,
    fromISO,
    toISO,
  );
}

/** ISO timestamp of the most recent cigarette, or null if none logged. */
export async function getLastCigaretteTimestamp(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ timestamp: string }>(
    'SELECT timestamp FROM cigarette_log ORDER BY timestamp DESC LIMIT 1',
  );
  return row?.timestamp ?? null;
}

export async function countCigarettesSince(
  timestampISO: string,
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM cigarette_log WHERE timestamp >= ?',
    timestampISO,
  );
  return row?.c ?? 0;
}

/** Per-day counts of PAID cigarettes (gifted excluded) — drives savings. */
export async function getDailyPaidCigaretteCounts(
  fromISO: string,
  toISO: string,
): Promise<DailyCount[]> {
  const db = await getDb();
  return db.getAllAsync<DailyCount>(
    `SELECT substr(timestamp, 1, 10) AS date, COUNT(*) AS count
       FROM cigarette_log
      WHERE gifted = 0 AND substr(timestamp, 1, 10) BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date`,
    fromISO,
    toISO,
  );
}

/** Health-weighted cigarette count since a timestamp (shared counts as 0.5). */
export async function healthWeightedCountSince(
  timestampISO: string,
): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ w: number }>(
    `SELECT COALESCE(SUM(CASE WHEN shared = 1 THEN 0.5 ELSE 1 END), 0) AS w
       FROM cigarette_log WHERE timestamp >= ?`,
    timestampISO,
  );
  return row?.w ?? 0;
}

/** Dev/God-mode: wipe all cigarette logs. */
export async function clearAllCigaretteLogs(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM cigarette_log');
}

/** Dev/God-mode: delete the most recent cigarette logged on a local day. */
export async function deleteLatestCigaretteOnDate(
  dateISO: string,
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `DELETE FROM cigarette_log WHERE id = (
       SELECT id FROM cigarette_log
        WHERE substr(timestamp, 1, 10) = ?
        ORDER BY timestamp DESC, id DESC
        LIMIT 1)`,
    dateISO,
  );
}

/** Dev/God-mode: delete every cigarette logged on a local day. */
export async function clearCigarettesOnDate(dateISO: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'DELETE FROM cigarette_log WHERE substr(timestamp, 1, 10) = ?',
    dateISO,
  );
}

/** Dev/God-mode: shift every cigarette timestamp by whole days (time travel). */
export async function shiftCigaretteDates(deltaDays: number): Promise<void> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; timestamp: string }>(
    'SELECT id, timestamp FROM cigarette_log',
  );
  for (const r of rows) {
    await db.runAsync(
      'UPDATE cigarette_log SET timestamp = ? WHERE id = ?',
      shiftLocalISO(r.timestamp, deltaDays),
      r.id,
    );
  }
}
