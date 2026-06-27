import { describe, expect, it } from '@jest/globals';

import {
  currentPhaseId,
  daySetbackHours,
  HEALTH_MILESTONES,
  HEALTH_PHASES,
  milestoneTimeline,
  nextMilestone,
  reachedCount,
  recoveryHoursFrom,
  totalSetbackHours,
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

describe('slip setback', () => {
  it('is zero for a clean day and grows with cigarettes', () => {
    expect(daySetbackHours(0, 3)).toBe(0);
    expect(daySetbackHours(2, 3)).toBeGreaterThan(daySetbackHours(1, 3));
  });

  it('punishes over-quota cigarettes harder', () => {
    // Same 4 cigarettes hurt more when the allowance is lower (more over quota).
    expect(daySetbackHours(4, 3)).toBeGreaterThan(daySetbackHours(4, 10));
  });

  it('totals across days', () => {
    expect(totalSetbackHours([1, 2], [3, 3])).toBeCloseTo(
      daySetbackHours(1, 3) + daySetbackHours(2, 3),
    );
  });
});

describe('recoveryHoursFrom', () => {
  it('equals elapsed when there is no setback', () => {
    expect(recoveryHoursFrom(100, 0)).toBe(100);
  });

  it('subtracts a small setback directly', () => {
    expect(recoveryHoursFrom(100, 10)).toBe(90);
  });

  it('floors at zero and never goes negative', () => {
    expect(recoveryHoursFrom(100, 999999)).toBe(0);
    expect(recoveryHoursFrom(0, 50)).toBe(0);
  });
});
