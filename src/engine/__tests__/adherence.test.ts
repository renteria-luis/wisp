import { describe, expect, it } from '@jest/globals';

import {
  countWinDays,
  currentTrend,
  currentWinStreak,
  recommendReplan,
  rollingAverage,
  winDay,
} from '../adherence';

describe('rollingAverage', () => {
  it('averages up to the trailing window, including the current day', () => {
    expect(rollingAverage([3, 3, 3], 7)).toEqual([3, 3, 3]);
    // window of 2: [2, (2+4)/2, (4+0)/2]
    expect(rollingAverage([2, 4, 0], 2)).toEqual([2, 3, 2]);
  });

  it('currentTrend returns the latest rolling value', () => {
    expect(currentTrend([4, 4, 1, 1], 2)).toBe(1);
    expect(currentTrend([], 7)).toBe(0);
  });
});

describe('win days', () => {
  it('counts a day at or under allowance as a win', () => {
    expect(winDay(2, 3)).toBe(true);
    expect(winDay(3, 3)).toBe(true);
    expect(winDay(4, 3)).toBe(false);
  });

  it('counts and streaks trailing wins', () => {
    const actual = [5, 2, 2, 1];
    const allow = [4, 3, 2, 2];
    expect(countWinDays(actual, allow)).toBe(3); // days 1..3 win, day 0 loses
    expect(currentWinStreak(actual, allow)).toBe(3);
  });
});

describe('recommendReplan — non-punitive', () => {
  it('eases when the trend stays over allowance for OVER_DAYS', () => {
    const actual = [5, 5, 5, 5, 5];
    const allow = [4, 3, 3, 2, 2];
    const rec = recommendReplan({ actual, allowances: allow, window: 3 });
    expect(rec.action).toBe('ease');
  });

  it('absorbs a single slip: one spike never eases (punishes) the plan', () => {
    // At target, then one bad day. The trend ticks just over for a single day,
    // below the OVER_DAYS threshold, so no punitive re-plan fires.
    const actual = [3, 3, 3, 3, 3, 3, 8];
    const allow = [3, 3, 3, 3, 3, 3, 3];
    const rec = recommendReplan({ actual, allowances: allow });
    expect(rec.action).toBe('hold');
  });

  it('offers acceleration when comfortably under for a sustained stretch', () => {
    const actual = [0, 0, 0, 0];
    const allow = [3, 3, 3, 3];
    const rec = recommendReplan({
      actual,
      allowances: allow,
      window: 2,
      underMargin: 1,
    });
    expect(rec.action).toBe('accelerate');
  });

  it('holds on an empty series', () => {
    expect(recommendReplan({ actual: [], allowances: [] }).action).toBe('hold');
  });
});
