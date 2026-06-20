import { describe, expect, it } from '@jest/globals';

import { densifyDailyCounts } from '../series';

describe('densifyDailyCounts', () => {
  it('fills missing days with zero across the inclusive range', () => {
    const rows = [
      { date: '2026-06-10', count: 3 },
      { date: '2026-06-12', count: 1 },
    ];
    expect(densifyDailyCounts(rows, '2026-06-10', '2026-06-13')).toEqual([
      { date: '2026-06-10', count: 3 },
      { date: '2026-06-11', count: 0 },
      { date: '2026-06-12', count: 1 },
      { date: '2026-06-13', count: 0 },
    ]);
  });

  it('returns a single day when from equals to', () => {
    expect(densifyDailyCounts([], '2026-06-10', '2026-06-10')).toEqual([
      { date: '2026-06-10', count: 0 },
    ]);
  });

  it('ignores rows outside the requested range', () => {
    expect(
      densifyDailyCounts(
        [{ date: '2026-01-01', count: 9 }],
        '2026-06-10',
        '2026-06-11',
      ),
    ).toEqual([
      { date: '2026-06-10', count: 0 },
      { date: '2026-06-11', count: 0 },
    ]);
  });
});
