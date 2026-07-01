/**
 * Small pure date helpers built on date-fns. We standardize on ISO calendar
 * dates (`yyyy-MM-dd`) for anything persisted so plans are timezone-stable.
 */
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export const ISO_DATE = 'yyyy-MM-dd';

export function todayISO(now: Date = new Date()): string {
  return format(now, ISO_DATE);
}

/**
 * Local wall-clock timestamp (NO timezone suffix) whose first 10 chars equal
 * `todayISO()`. Persisted log rows use this so day-bucketing
 * (`substr(timestamp, 1, 10)`) lines up with the user's calendar day instead of
 * UTC. With a plain `new Date().toISOString()` (UTC), an evening cigarette in a
 * UTC-behind timezone (e.g. Peru/Canada) lands on "tomorrow" and never counts
 * toward today — the "logged cigarette doesn't add up" bug.
 */
export function nowISO(now: Date = new Date()): string {
  return format(now, "yyyy-MM-dd'T'HH:mm:ss.SSS");
}

/** Shift a stored local-naive timestamp by whole days, keeping the same format. */
export function shiftLocalISO(iso: string, deltaDays: number): string {
  return nowISO(new Date(new Date(iso).getTime() + deltaDays * 86_400_000));
}

export function toISODate(date: Date): string {
  return format(date, ISO_DATE);
}

export function addDaysISO(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), ISO_DATE);
}

/** Whole calendar days from `fromISO` to `toISO` (negative if `toISO` is earlier). */
export function daysBetween(fromISO: string, toISO: string): number {
  return differenceInCalendarDays(parseISO(toISO), parseISO(fromISO));
}

/** Friendly medium date, e.g. "Jul 17, 2026". */
export function formatMedium(iso: string): string {
  return format(parseISO(iso), 'PP');
}
