import { describe, expect, it } from '@jest/globals';

import {
  HEALTH_MILESTONES,
  milestoneTimeline,
  nextMilestone,
  reachedCount,
} from '../health';

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

  it('marks a milestone reached once its hour passes', () => {
    // 13h in: 20-min pulse + 12h CO are reached; the 1-day nicotine point is not.
    const tl = milestoneTimeline(13);
    const byId = Object.fromEntries(tl.map((m) => [m.milestone.id, m]));
    expect(byId.pulse!.reached).toBe(true);
    expect(byId.co!.reached).toBe(true);
    expect(byId.nicotine!.reached).toBe(false);
    // The current segment is partially filled, strictly between 0 and 1.
    expect(byId.nicotine!.progress).toBeGreaterThan(0);
    expect(byId.nicotine!.progress).toBeLessThan(1);
  });

  it('reached milestones always report full progress', () => {
    for (const m of milestoneTimeline(48)) {
      if (m.reached) expect(m.progress).toBe(1);
    }
  });

  it('clamps negative elapsed time to the start', () => {
    expect(milestoneTimeline(-100)).toEqual(milestoneTimeline(0));
  });
});

describe('reachedCount & nextMilestone', () => {
  it('counts reached milestones', () => {
    expect(reachedCount(0)).toBe(0);
    expect(reachedCount(13)).toBe(2);
  });

  it('points at the first milestone still ahead', () => {
    expect(nextMilestone(13)?.milestone.id).toBe('nicotine');
  });

  it('returns null once every milestone is reached', () => {
    const farFuture = HEALTH_MILESTONES.at(-1)!.atHours + 1;
    expect(reachedCount(farFuture)).toBe(HEALTH_MILESTONES.length);
    expect(nextMilestone(farFuture)).toBeNull();
  });
});
