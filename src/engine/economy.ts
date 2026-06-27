/**
 * Coin economy (PROJECT.md §7.3). Pure.
 *
 * The defining mechanic: the longer the smoke-free stretch, the faster coins
 * accrue (exponential, capped). The same duration-based accrual rewards the gaps
 * between cigarettes on the reduction track. Discrete bonuses on top.
 */

export const BASE_RATE = 5;
export const GROWTH = 0.15;
export const STEP_HOURS = 24;
export const MAX_RATE = BASE_RATE * 8;

/** Discrete bonuses (§7.3). */
export const BONUS_CHECK_IN = 10;
export const BONUS_RESISTED_CRAVING = 8;
export const BONUS_WIN_DAY = 15;
export const BONUS_MILESTONE = 50;

/** Recovery reward: each health milestone reached lifts the coin rate a little,
 *  capped so it stays meaningful per phase without breaking the economy. */
export const RECOVERY_MULT_STEP = 0.07;
export const RECOVERY_MULT_CAP = 3;

/** Coin-rate multiplier for how far along the recovery milestones the user is. */
export function recoveryMultiplier(milestonesReached: number): number {
  return Math.min(
    RECOVERY_MULT_CAP,
    1 + Math.max(0, milestonesReached) * RECOVERY_MULT_STEP,
  );
}

/** Coins/hour at a given smoke-free streak length, stepping up ~GROWTH per day. */
export function ratePerHour(streakHours: number): number {
  const steps = Math.floor(Math.max(0, streakHours) / STEP_HOURS);
  return Math.min(BASE_RATE * Math.pow(1 + GROWTH, steps), MAX_RATE);
}

/**
 * Coins earned over `elapsedHours` of continued smoke-free time, where the
 * streak was already `streakStartHours` long when the interval began. Integrates
 * the (piecewise-constant) rate across STEP_HOURS buckets.
 */
export function accrueCoins(
  streakStartHours: number,
  elapsedHours: number,
): number {
  if (elapsedHours <= 0) return 0;
  let coins = 0;
  let h = Math.max(0, streakStartHours);
  let remaining = elapsedHours;
  while (remaining > 0) {
    const nextBoundary = (Math.floor(h / STEP_HOURS) + 1) * STEP_HOURS;
    const chunk = Math.min(remaining, nextBoundary - h);
    coins += ratePerHour(h) * chunk;
    h += chunk;
    remaining -= chunk;
  }
  return coins;
}
