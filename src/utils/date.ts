/**
 * Small pure date helpers built on date-fns. We standardize on ISO calendar
 * dates (`yyyy-MM-dd`) for anything persisted so plans are timezone-stable.
 */
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export const ISO_DATE = 'yyyy-MM-dd';

export function todayISO(now: Date = new Date()): string {
  return format(now, ISO_DATE);
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
