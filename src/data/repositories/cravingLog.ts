/** Craving log repository (PROJECT.md §16). Thin SQLite I/O. */
import type { TriggerCategory } from '@/types/domain';
import { nowISO } from '@/utils/date';

import { getDb } from '../db';

export interface CravingRow {
  id: number;
  timestamp: string;
  resisted: number;
  trigger_category: string | null;
  intensity: number | null;
  note: string | null;
}

export async function addCraving(input: {
  resisted: boolean;
  timestamp?: string;
  trigger?: TriggerCategory;
  intensity?: number;
  note?: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO craving_log (timestamp, resisted, trigger_category, intensity, note) VALUES (?, ?, ?, ?, ?)',
    input.timestamp ?? nowISO(),
    input.resisted ? 1 : 0,
    input.trigger ?? null,
    input.intensity ?? null,
    input.note ?? null,
  );
}

export async function countResistedOnDate(dateISO: string): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) AS c FROM craving_log WHERE resisted = 1 AND substr(timestamp, 1, 10) = ?',
    dateISO,
  );
  return row?.c ?? 0;
}

/** Dev/God-mode: wipe all craving logs. */
export async function clearAllCravingLogs(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM craving_log');
}
