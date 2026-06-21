/**
 * Triggers → schedule specs (PROJECT.md §6.9, §9). Pure.
 *
 * Converts the user's selected trigger categories into a set of daily local
 * notification windows (a gentle nudge around each high-risk moment), and
 * exposes the situational "I'm out / drinking" support cadence. Actual
 * scheduling (I/O) lives in `src/notifications/scheduler.ts`.
 */
import type { QuietHours, TimeOfDay, TriggerCategory } from '@/types/domain';

/** Representative default times per category (local). Editable later in settings. */
export const DEFAULT_WINDOWS: Record<TriggerCategory, TimeOfDay[]> = {
  work_break: [
    { hour: 10, minute: 30 },
    { hour: 14, minute: 30 },
    { hour: 17, minute: 0 },
  ],
  commute: [
    { hour: 8, minute: 0 },
    { hour: 18, minute: 0 },
  ],
  after_meals: [
    { hour: 8, minute: 30 },
    { hour: 13, minute: 0 },
    { hour: 19, minute: 30 },
  ],
  alcohol_social: [{ hour: 20, minute: 0 }],
  stress: [{ hour: 15, minute: 0 }],
  boredom: [{ hour: 16, minute: 0 }],
  coffee: [{ hour: 9, minute: 0 }],
};

/** Situational mode cadence: support pings for this long, this often. */
export const SITUATIONAL_HOURS = 3;
export const SITUATIONAL_INTERVAL_MINUTES = 45;

export interface TriggerWindow extends TimeOfDay {
  category: TriggerCategory;
}

export function minutesOfDay(t: TimeOfDay): number {
  return t.hour * 60 + t.minute;
}

/** True if `t` falls inside the quiet-hours window (handles overnight ranges). */
export function isWithinQuietHours(
  t: TimeOfDay,
  quiet: QuietHours | null,
): boolean {
  if (!quiet) return false;
  const m = minutesOfDay(t);
  const start = minutesOfDay(quiet.start);
  const end = minutesOfDay(quiet.end);
  if (start === end) return false;
  return start < end ? m >= start && m < end : m >= start || m < end;
}

/** Daily trigger windows from the selected categories, minus quiet hours, sorted. */
export function buildTriggerWindows(
  categories: TriggerCategory[],
  quiet: QuietHours | null,
): TriggerWindow[] {
  const out: TriggerWindow[] = [];
  for (const category of categories) {
    for (const t of DEFAULT_WINDOWS[category] ?? []) {
      if (!isWithinQuietHours(t, quiet)) out.push({ category, ...t });
    }
  }
  return out.sort((a, b) => minutesOfDay(a) - minutesOfDay(b));
}

/** Minutes-from-now at which to send situational support pings. */
export function situationalOffsets(
  hours = SITUATIONAL_HOURS,
  intervalMinutes = SITUATIONAL_INTERVAL_MINUTES,
): number[] {
  const out: number[] = [];
  for (let m = intervalMinutes; m <= hours * 60; m += intervalMinutes) {
    out.push(m);
  }
  return out;
}
