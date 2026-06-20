import { describe, expect, it } from '@jest/globals';

import type { ReadinessInputs } from '@/types/domain';

import {
  allowanceForDay,
  buildPlan,
  COLD_TURKEY_WINDOW_DAYS,
  suggestTrack,
} from '../planEngine';

function inputs(over: Partial<ReadinessInputs>): ReadinessInputs {
  return {
    cigarettesPerDay: 5,
    readiness: 5,
    preference: 'unsure',
    ...over,
  };
}

describe('suggestTrack', () => {
  it('suggests cold turkey for a light, ready smoker who wants to quit', () => {
    const s = suggestTrack(
      inputs({ cigarettesPerDay: 5, readiness: 9, preference: 'quit' }),
    );
    expect(s.track).toBe('cold_turkey');
    expect(s.score).toBeGreaterThan(0);
  });

  it('suggests gradual reduction for a heavy smoker who wants to cut down', () => {
    const s = suggestTrack(
      inputs({ cigarettesPerDay: 25, readiness: 4, preference: 'reduce' }),
    );
    expect(s.track).toBe('gradual_reduction');
  });

  it('routes the light-but-tapering persona (Tiffani) to gradual reduction', () => {
    // ~4/day but prefers to cut down rather than stop outright.
    const s = suggestTrack(
      inputs({ cigarettesPerDay: 4, readiness: 6, preference: 'reduce' }),
    );
    expect(s.track).toBe('gradual_reduction');
  });

  it('lets high dependence pull an otherwise-neutral profile toward gradual', () => {
    const neutral = suggestTrack(
      inputs({ cigarettesPerDay: 8, readiness: 5, preference: 'unsure' }),
    );
    const dependent = suggestTrack(
      inputs({
        cigarettesPerDay: 8,
        readiness: 5,
        preference: 'unsure',
        minutesToFirstCigarette: 5,
      }),
    );
    expect(dependent.score).toBeLessThan(neutral.score);
    expect(dependent.track).toBe('gradual_reduction');
  });

  it('exposes an i18n rationale key matching the track', () => {
    const s = suggestTrack(inputs({ preference: 'quit', readiness: 9 }));
    expect(s.rationaleKey).toBe(`plan.rationale.${s.track}`);
  });
});

describe('buildPlan — cold turkey', () => {
  const plan = buildPlan({
    track: 'cold_turkey',
    baseline: 6,
    startDate: '2026-06-20',
  });

  it('quits immediately: target date is the start date', () => {
    expect(plan.targetDate).toBe('2026-06-20');
  });

  it('spans the critical window with a zero allowance throughout', () => {
    expect(plan.nDays).toBe(COLD_TURKEY_WINDOW_DAYS);
    expect(plan.allowances).toHaveLength(COLD_TURKEY_WINDOW_DAYS);
    expect(plan.allowances.every((a) => a === 0)).toBe(true);
  });
});

describe('buildPlan — gradual reduction', () => {
  const plan = buildPlan({
    track: 'gradual_reduction',
    baseline: 4,
    startDate: '2026-06-20',
  });

  it('builds a taper of the derived length ending on the target date', () => {
    expect(plan.nDays).toBe(28); // 4 * 7
    expect(plan.allowances).toHaveLength(28);
    expect(plan.allowances[0]).toBe(4);
    expect(plan.allowances[plan.nDays - 1]).toBe(0);
    // target date = start + (nDays - 1) days
    expect(plan.targetDate).toBe('2026-07-17');
  });
});

describe('allowanceForDay', () => {
  const plan = buildPlan({
    track: 'gradual_reduction',
    baseline: 10,
    startDate: '2026-06-20',
  });

  it('clamps day indices to the plan range', () => {
    expect(allowanceForDay(plan, -5)).toBe(plan.allowances[0]);
    expect(allowanceForDay(plan, 9999)).toBe(0); // last day is always 0
    expect(allowanceForDay(plan, 0)).toBe(10);
  });
});
