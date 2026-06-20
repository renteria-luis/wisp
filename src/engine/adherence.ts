/**
 * Adherence, trend & re-planning (PROJECT.md §6.3).
 *
 * Pure functions over aligned daily arrays (actual cigarettes vs plan allowance,
 * oldest → newest). The PRIMARY metric is the 7-day rolling average — streak and
 * win-days are secondary/motivational. Re-planning is non-punitive: a spike is
 * absorbed by the trend and never zeroes history.
 */

/** Primary metric window. */
export const ROLLING_WINDOW = 7;
/** Consecutive days the trend must exceed allowance before easing the curve. */
export const OVER_DAYS = 3;
/** Trend must sit at least this far under allowance to offer acceleration. */
export const UNDER_MARGIN = 1;

/** Trailing average (up to `window` values, including the current day). */
export function rollingAverage(
  values: number[],
  window = ROLLING_WINDOW,
): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    let sum = 0;
    let count = 0;
    for (let j = start; j <= i; j++) {
      sum += values[j] ?? 0;
      count++;
    }
    out.push(count === 0 ? 0 : sum / count);
  }
  return out;
}

/** The latest trend value (0 for an empty series). */
export function currentTrend(
  values: number[],
  window = ROLLING_WINDOW,
): number {
  const rolling = rollingAverage(values, window);
  return rolling[rolling.length - 1] ?? 0;
}

/** A "win day" is at or under allowance — not only zero (§5.2). */
export function winDay(actual: number, allowance: number): boolean {
  return actual <= allowance;
}

export function winDays(actual: number[], allowances: number[]): boolean[] {
  const n = Math.min(actual.length, allowances.length);
  const out: boolean[] = [];
  for (let i = 0; i < n; i++)
    out.push(winDay(actual[i] ?? 0, allowances[i] ?? 0));
  return out;
}

export function countWinDays(actual: number[], allowances: number[]): number {
  return winDays(actual, allowances).filter(Boolean).length;
}

/** Consecutive win days counting back from the most recent day. */
export function currentWinStreak(
  actual: number[],
  allowances: number[],
): number {
  const flags = winDays(actual, allowances);
  let streak = 0;
  for (let i = flags.length - 1; i >= 0; i--) {
    if (flags[i]) streak++;
    else break;
  }
  return streak;
}

export type ReplanRecommendation =
  | { action: 'hold' }
  /** Curve too aggressive — flatten/extend it. */
  | { action: 'ease'; daysOver: number }
  /** Comfortably under target — *offer* (don't force) to accelerate. */
  | { action: 'accelerate'; daysUnder: number };

export interface ReplanParams {
  actual: number[];
  allowances: number[];
  window?: number;
  overDays?: number;
  underMargin?: number;
}

/**
 * Recommend a non-punitive plan adjustment based on the trend (never the raw
 * latest day). Ease wins over accelerate when both somehow apply.
 */
export function recommendReplan({
  actual,
  allowances,
  window = ROLLING_WINDOW,
  overDays = OVER_DAYS,
  underMargin = UNDER_MARGIN,
}: ReplanParams): ReplanRecommendation {
  const n = Math.min(actual.length, allowances.length);
  if (n === 0) return { action: 'hold' };

  const rolling = rollingAverage(actual.slice(0, n), window);

  let over = 0;
  for (let i = n - 1; i >= 0; i--) {
    if ((rolling[i] ?? 0) > (allowances[i] ?? 0)) over++;
    else break;
  }
  if (over >= overDays) return { action: 'ease', daysOver: over };

  let under = 0;
  for (let i = n - 1; i >= 0; i--) {
    if ((rolling[i] ?? 0) + underMargin <= (allowances[i] ?? 0)) under++;
    else break;
  }
  if (under >= overDays) return { action: 'accelerate', daysUnder: under };

  return { action: 'hold' };
}
