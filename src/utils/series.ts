import { addDaysISO, daysBetween } from './date';

export interface DailyCount {
  date: string;
  count: number;
}

/**
 * Expand sparse per-day rows (days with no entries are absent) into a
 * contiguous series from `fromISO` to `toISO` inclusive, filling gaps with 0.
 * This is the dense input the adherence/trend engine consumes in Phase 3.
 */
export function densifyDailyCounts(
  rows: DailyCount[],
  fromISO: string,
  toISO: string,
): DailyCount[] {
  const byDate = new Map(rows.map((r) => [r.date, r.count]));
  const span = daysBetween(fromISO, toISO);
  const out: DailyCount[] = [];
  for (let i = 0; i <= span; i++) {
    const date = addDaysISO(fromISO, i);
    out.push({ date, count: byDate.get(date) ?? 0 });
  }
  return out;
}
