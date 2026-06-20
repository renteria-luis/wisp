/** Daily check-in repository (PROJECT.md §16). One row per calendar day. */
import { getDb } from '../db';

export interface CheckInRow {
  id: number;
  date: string;
  mood: number | null;
  note: string | null;
}

/** Insert or update the check-in for a given day. */
export async function upsertCheckIn(input: {
  date: string;
  mood?: number;
  note?: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO check_in (date, mood, note) VALUES (?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET mood = excluded.mood, note = excluded.note`,
    input.date,
    input.mood ?? null,
    input.note ?? null,
  );
}

export async function getCheckIn(dateISO: string): Promise<CheckInRow | null> {
  const db = await getDb();
  return db.getFirstAsync<CheckInRow>(
    'SELECT * FROM check_in WHERE date = ?',
    dateISO,
  );
}
