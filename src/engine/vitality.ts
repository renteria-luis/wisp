/**
 * Companion vitality (PROJECT.md §6.4). Pure.
 *
 * vitality = clamp(BASE - penalty + bonus, 0, 100), derived from recent behavior
 * over a short window. Penalty scales with recent (and over-target) smoking;
 * bonus with the smoke-free stretch and being under target. Bands drive the
 * companion's expression/palette/glow.
 */
import type { VitalityState } from '@/types/domain';

import { clamp } from './reduction';

export const VITALITY_WINDOW_HOURS = 60;
export const VITALITY_BASE = 60;
export const PENALTY_PER_CIG = 4;
export const PENALTY_PER_OVER = 6;
export const BONUS_PER_SMOKEFREE_HOUR = 0.6;
export const BONUS_PER_UNDER = 5;

export interface VitalityInput {
  /** Cigarettes logged within the recent window. */
  recentCigarettes: number;
  /** Expected/target cigarettes over the same window (sum of allowances). */
  recentTarget: number;
  /** Hours since the last cigarette (the current smoke-free stretch). */
  hoursSinceLastCigarette: number;
}

export function computeVitality({
  recentCigarettes,
  recentTarget,
  hoursSinceLastCigarette,
}: VitalityInput): number {
  const over = Math.max(0, recentCigarettes - recentTarget);
  const under = Math.max(0, recentTarget - recentCigarettes);
  const penalty = recentCigarettes * PENALTY_PER_CIG + over * PENALTY_PER_OVER;
  const stretch =
    Math.min(Math.max(0, hoursSinceLastCigarette), VITALITY_WINDOW_HOURS) *
    BONUS_PER_SMOKEFREE_HOUR;
  const bonus = stretch + under * BONUS_PER_UNDER;
  return clamp(Math.round(VITALITY_BASE - penalty + bonus), 0, 100);
}

/** Map a 0–100 score to a companion band (§6.4). */
export function vitalityBand(score: number): VitalityState {
  if (score <= 25) return 'exhausted';
  if (score <= 50) return 'tired';
  if (score <= 75) return 'okay';
  return 'radiant';
}
