import { describe, expect, it } from '@jest/globals';

import {
  MAX_DAYS,
  MIN_DAYS,
  reductionCurve,
  reductionDurationDays,
} from '../reduction';

describe('reductionDurationDays', () => {
  it('clamps to the minimum for light smokers', () => {
    expect(reductionDurationDays(1)).toBe(MIN_DAYS);
    expect(reductionDurationDays(2)).toBe(MIN_DAYS); // 2 * 7 = 14
  });

  it('scales with baseline in the middle of the range', () => {
    expect(reductionDurationDays(4)).toBe(28); // 4 * 7
    expect(reductionDurationDays(6)).toBe(42); // 6 * 7
  });

  it('clamps to the maximum for heavy smokers', () => {
    expect(reductionDurationDays(20)).toBe(MAX_DAYS); // 140 → 84
    expect(reductionDurationDays(40)).toBe(MAX_DAYS);
  });

  it('never returns less than the minimum, even for zero', () => {
    expect(reductionDurationDays(0)).toBe(MIN_DAYS);
  });
});

describe('reductionCurve invariants (linear & easeOut)', () => {
  const cases: [number, number][] = [
    [4, 28],
    [20, 84],
    [10, 40],
  ];

  for (const curveType of ['linear', 'easeOut'] as const) {
    for (const [baseline, nDays] of cases) {
      it(`${curveType}: b=${baseline} n=${nDays} starts ~baseline, ends 0, never increases`, () => {
        const curve = reductionCurve(baseline, nDays, curveType);
        expect(curve).toHaveLength(nDays);
        expect(curve[0]).toBe(baseline); // day 0 starts at baseline
        expect(curve[nDays - 1]).toBe(0); // ends at zero

        for (let i = 0; i < curve.length; i++) {
          expect(Number.isInteger(curve[i])).toBe(true);
          expect(curve[i]).toBeGreaterThanOrEqual(0);
          if (i > 0) expect(curve[i]).toBeLessThanOrEqual(curve[i - 1]!);
        }
      });
    }
  }

  it('easeOut reduces faster early than linear (gentler near the end)', () => {
    const baseline = 20;
    const n = 40;
    const linear = reductionCurve(baseline, n, 'linear');
    const easeOut = reductionCurve(baseline, n, 'easeOut');
    const mid = Math.floor(n / 2);
    // By the midpoint, easeOut has already dropped well below half of baseline.
    expect(easeOut[mid]!).toBeLessThan(linear[mid]!);
    expect(easeOut[mid]!).toBeLessThan(baseline / 2);
  });
});

describe('reductionCurve edge cases', () => {
  it('returns all zeros for a zero baseline', () => {
    expect(reductionCurve(0, 5)).toEqual([0, 0, 0, 0, 0]);
  });

  it('returns an empty array for non-positive duration', () => {
    expect(reductionCurve(10, 0)).toEqual([]);
  });

  it('handles a single-day plan', () => {
    expect(reductionCurve(10, 1)).toEqual([0]);
  });
});
