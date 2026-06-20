/**
 * Track assignment + plan construction (PROJECT.md §6.1).
 *
 * Pure and deterministic: no UI, no I/O. The suggestion is a transparent score
 * the onboarding UI can always override before committing a plan.
 */
import type {
  CurveType,
  Plan,
  ReadinessInputs,
  Track,
  TrackSuggestion,
} from '@/types/domain';
import { addDaysISO } from '@/utils/date';

import {
  clamp,
  MAX_DAYS,
  MIN_DAYS,
  reductionCurve,
  reductionDurationDays,
} from './reduction';

/** At/below this many cigarettes/day leans toward cold turkey. */
export const LIGHT_CONSUMPTION_MAX = 10;
/** Readiness at/above this leans toward cold turkey. */
export const HIGH_READINESS_MIN = 7;
/** Readiness at/below this leans toward gradual reduction. */
export const LOW_READINESS_MAX = 3;
/** First cigarette within this many minutes of waking signals high dependence. */
export const HIGH_DEPENDENCE_MINUTES = 30;
/** Default cold-turkey "critical window" of front-loaded support (days). */
export const COLD_TURKEY_WINDOW_DAYS = 14;

/**
 * Heuristic track suggestion. Positive score → cold turkey, ≤0 → gradual.
 * Explicit preference is weighted heaviest; ties resolve to the gentler
 * gradual-reduction track.
 */
export function suggestTrack(inputs: ReadinessInputs): TrackSuggestion {
  const {
    cigarettesPerDay: baseline,
    readiness,
    minutesToFirstCigarette: minsToFirst,
    preference,
  } = inputs;

  let score = 0;

  // Consumption: lighter smokers can more realistically stop outright.
  score += baseline <= LIGHT_CONSUMPTION_MAX ? 1 : -1;

  // Readiness / confidence.
  if (readiness >= HIGH_READINESS_MIN) score += 1;
  else if (readiness <= LOW_READINESS_MAX) score -= 1;

  // Dependence: smoking soon after waking → taper rather than abrupt stop.
  if (minsToFirst != null && minsToFirst <= HIGH_DEPENDENCE_MINUTES) score -= 1;

  // Explicit preference dominates.
  if (preference === 'quit') score += 2;
  else if (preference === 'reduce') score -= 2;

  const track: Track = score > 0 ? 'cold_turkey' : 'gradual_reduction';
  return { track, score, rationaleKey: `plan.rationale.${track}` };
}

export interface BuildPlanParams {
  track: Track;
  baseline: number;
  /** ISO `yyyy-MM-dd` day 0 of the plan (quit date for cold turkey). */
  startDate: string;
  /** Curve shape for the reduction track. */
  curveType?: CurveType;
}

/** Build the concrete plan for a chosen track. */
export function buildPlan({
  track,
  baseline,
  startDate,
  curveType = 'linear',
}: BuildPlanParams): Plan {
  if (track === 'cold_turkey') {
    const nDays = COLD_TURKEY_WINDOW_DAYS;
    return {
      track,
      baseline,
      curveType,
      nDays,
      startDate,
      targetDate: startDate, // quit date is day 0
      allowances: new Array<number>(nDays).fill(0),
    };
  }

  const nDays = reductionDurationDays(baseline);
  const allowances = reductionCurve(baseline, nDays, curveType);
  return {
    track,
    baseline,
    curveType,
    nDays,
    startDate,
    targetDate: addDaysISO(startDate, nDays - 1),
    allowances,
  };
}

/** Allowance for a given calendar day index into the plan (clamped). */
export function allowanceForDay(plan: Plan, dayIndex: number): number {
  if (plan.allowances.length === 0) return 0;
  const i = clampIndex(dayIndex, plan.allowances.length);
  return plan.allowances[i] ?? 0;
}

function clampIndex(i: number, length: number): number {
  if (i < 0) return 0;
  if (i >= length) return length - 1;
  return i;
}

/** Duration multipliers when re-planning from the current trend (§6.3). */
export const EASE_FACTOR = 1.5;
export const ACCELERATE_FACTOR = 0.6;

/**
 * Rebuild a reduction plan anchored at `startDate` from the user's recent
 * average. `durationFactor` > 1 eases (flatten/extend); < 1 accelerates. Always
 * non-punitive: it re-anchors at a realistic level and tapers to 0 — logs and
 * history are untouched.
 */
export function rebuildReductionPlan({
  recentAverage,
  startDate,
  curveType = 'linear',
  durationFactor = 1,
}: {
  recentAverage: number;
  startDate: string;
  curveType?: CurveType;
  durationFactor?: number;
}): Plan {
  const baseline = Math.max(1, Math.round(recentAverage));
  const base = reductionDurationDays(baseline);
  const nDays = clamp(Math.round(base * durationFactor), MIN_DAYS, MAX_DAYS);
  const allowances = reductionCurve(baseline, nDays, curveType);
  return {
    track: 'gradual_reduction',
    baseline,
    curveType,
    nDays,
    startDate,
    targetDate: addDaysISO(startDate, nDays - 1),
    allowances,
  };
}
