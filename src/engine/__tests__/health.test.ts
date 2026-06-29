import { describe, expect, it } from '@jest/globals';

import {
  cigarettePenaltyHours,
  currentPhaseId,
  HEALTH_MILESTONES,
  HEALTH_PHASES,
  liveRecoveryHours,
  milestoneTimeline,
  nextMilestone,
  reachedCount,
  WITHIN_QUOTA_HOURS,
} from '../health';

describe('phases & milestones', () => {
  it('flattens phases into the milestone list, ascending', () => {
    expect(HEALTH_PHASES.flatMap((p) => p.milestones)).toEqual(
      HEALTH_MILESTONES,
    );
    const hours = HEALTH_MILESTONES.map((m) => m.atHours);
    expect([...hours].sort((a, b) => a - b)).toEqual(hours);
  });

  it('every milestone has a citation source', () => {
    for (const m of HEALTH_MILESTONES) expect(m.source.length).toBeGreaterThan(0);
  });
});

describe('milestoneTimeline', () => {
  it('returns one entry per milestone, in order', () => {
    const tl = milestoneTimeline(0);
    expect(tl).toHaveLength(HEALTH_MILESTONES.length);
    expect(tl.map((m) => m.milestone.id)).toEqual(
      HEALTH_MILESTONES.map((m) => m.id),
    );
  });

  it('at the very start nothing is reached', () => {
    const tl = milestoneTimeline(0);
    expect(tl.every((m) => !m.reached)).toBe(true);
    expect(tl[0]!.progress).toBe(0);
  });

  it('reached milestones always report full progress', () => {
    for (const m of milestoneTimeline(72)) {
      if (m.reached) expect(m.progress).toBe(1);
    }
  });

  it('clamps negative recovery to the start', () => {
    expect(milestoneTimeline(-100)).toEqual(milestoneTimeline(0));
  });
});

describe('reachedCount & nextMilestone', () => {
  it('is monotonic and bounded', () => {
    expect(reachedCount(0)).toBe(0);
    expect(reachedCount(13)).toBeGreaterThan(reachedCount(0));
    const far = HEALTH_MILESTONES.at(-1)!.atHours + 1;
    expect(reachedCount(far)).toBe(HEALTH_MILESTONES.length);
  });

  it('points at the first milestone still ahead', () => {
    expect(nextMilestone(0)?.milestone.id).toBe(HEALTH_MILESTONES[0]!.id);
    const far = HEALTH_MILESTONES.at(-1)!.atHours + 1;
    expect(nextMilestone(far)).toBeNull();
  });
});

describe('currentPhaseId', () => {
  it('starts in the first phase and ends in the last', () => {
    expect(currentPhaseId(0)).toBe(HEALTH_PHASES[0]!.id);
    const far = HEALTH_MILESTONES.at(-1)!.atHours + 1;
    expect(currentPhaseId(far)).toBe(HEALTH_PHASES.at(-1)!.id);
  });
});

describe('cigarettePenaltyHours', () => {
  it('scales within-quota cigarettes by the allowance', () => {
    // Each in-quota cigarette costs WITHIN_QUOTA_HOURS / allowance.
    expect(cigarettePenaltyHours(0, 10)).toBeCloseTo(WITHIN_QUOTA_HOURS / 10);
    // A quota of 10 → a clearly visible ~4h per cigarette.
    expect(cigarettePenaltyHours(0, 10)).toBeCloseTo(4);
    // 2 of 10 ≈ 20% of the full daily hit.
    const two = cigarettePenaltyHours(0, 10) + cigarettePenaltyHours(1, 10);
    expect(two).toBeCloseTo(0.2 * WITHIN_QUOTA_HOURS);
    // Smaller quota → each in-quota cigarette hurts more.
    expect(cigarettePenaltyHours(0, 3)).toBeGreaterThan(
      cigarettePenaltyHours(0, 10),
    );
  });

  it('hurts more over quota and escalates', () => {
    const inQuota = cigarettePenaltyHours(9, 10);
    const firstOver = cigarettePenaltyHours(10, 10);
    const secondOver = cigarettePenaltyHours(11, 10);
    // The first cigarette past the limit always costs more than an in-quota one.
    expect(firstOver).toBeGreaterThan(inQuota);
    expect(secondOver).toBeGreaterThan(firstOver);
  });

  it('treats every cigarette as a slip on cold turkey (allowance 0), escalating', () => {
    expect(cigarettePenaltyHours(0, 0)).toBeGreaterThan(0);
    expect(cigarettePenaltyHours(1, 0)).toBeGreaterThan(
      cigarettePenaltyHours(0, 0),
    );
  });
});

describe('liveRecoveryHours', () => {
  it('is base plus the time since the anchor', () => {
    const now = 10 * 3_600_000; // 10h in ms
    expect(liveRecoveryHours(2, 0, now)).toBeCloseTo(12);
  });

  it('floors at zero', () => {
    expect(liveRecoveryHours(0, 1000, 0)).toBe(0);
  });
});
