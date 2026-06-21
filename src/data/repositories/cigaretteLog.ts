/** Cigarette log repository (PROJECT.md §16). Thin SQLite I/O. */
import type { TriggerCategory } from '@/types/domain';
import type { DailyCount } from '@/utils/series';

import { getDb } from '../db';

export interface CigaretteRow {
  id: number;
  timestamp: string;
  trigger_category: string | null;
  note: string | null;
}

export async function addCigarette(input?: {
  timestamp?: string;
  trigger?: TriggerCategory;
  note?: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO cigarette_log (timestamp, trigger_category, note) VALUES (?, ?, ?)',
    input?.timestamp ?? new Date().toISOString(),
    input?.trigger ?? null,
    input?.note ?? null,
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
