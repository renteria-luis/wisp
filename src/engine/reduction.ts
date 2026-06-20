/**
 * Reduction curve (PROJECT.md §6.2).
 *
 * Pure: given a baseline and a duration, produce a daily-allowance schedule that
 * tapers baseline → 0, never increases day over day, and ends at exactly 0.
 *
 * All tunable constants are named exports so they are easy to adjust.
 */
import type { CurveType } from '@/types/domain';

/** Rough days of plan per baseline cigarette (before clamping). */
export const DAYS_PER_CIG = 7;
export const MIN_DAYS = 14;
export const MAX_DAYS = 84;
/**
 * Exponent for the `easeOut` curve. <1 makes the taper steeper early and
 * gentler near the end (the final cigarettes are the hardest to drop).
 */
export const EASE_EXPONENT = 0.65;

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Default plan length derived from baseline, clamped to a sane range. */
export function reductionDurationDays(baseline: number): number {
  if (baseline <= 0) return MIN_DAYS;
  return clamp(Math.round(baseline * DAYS_PER_CIG), MIN_DAYS, MAX_DAYS);
}

/**
 * Daily allowances of length `nDays`: index 0 ≈ baseline, last index = 0.
 * Guaranteed monotonic non-increasing and integer.
 */
export function reductionCurve(
  baseline: number,
  nDays: number,
  curveType: CurveType = 'linear',
): number[] {
  if (nDays <= 0) return [];
  if (baseline <= 0) return new Array<number>(nDays).fill(0);

  const out: number[] = [];
  let prev = Number.POSITIVE_INFINITY;

  for (let i = 0; i < nDays; i++) {
    const f = nDays === 1 ? 1 : i / (nDays - 1); // 0 → 1 across the plan
    const factor =
      curveType === 'easeOut' ? 1 - Math.pow(f, EASE_EXPONENT) : 1 - f;
    let allowance = Math.round(baseline * factor);
    if (allowance > prev) allowance = prev; // never increase
    if (allowance < 0) allowance = 0;
    out.push(allowance);
    prev = allowance;
  }

  out[nDays - 1] = 0; // the plan always ends at zero
  return out;
}
