import { describe, expect, it } from '@jest/globals';

import type { QuietHours } from '@/types/domain';

import {
  buildTriggerWindows,
  isWithinQuietHours,
  situationalOffsets,
} from '../triggers';

const overnight: QuietHours = {
  start: { hour: 22, minute: 0 },
  end: { hour: 7, minute: 0 },
};

describe('isWithinQuietHours', () => {
  it('handles an overnight window', () => {
    expect(isWithinQuietHours({ hour: 23, minute: 0 }, overnight)).toBe(true);
    expect(isWithinQuietHours({ hour: 3, minute: 0 }, overnight)).toBe(true);
    expect(isWithinQuietHours({ hour: 12, minute: 0 }, overnight)).toBe(false);
    expect(isWithinQuietHours({ hour: 7, minute: 0 }, overnight)).toBe(false);
  });

  it('returns false when there are no quiet hours', () => {
    expect(isWithinQuietHours({ hour: 3, minute: 0 }, null)).toBe(false);
  });
});

describe('buildTriggerWindows', () => {
  it('expands categories into sorted daily windows', () => {
    const windows = buildTriggerWindows(['work_break', 'commute'], null);
    expect(windows).toHaveLength(5);
    const minutes = windows.map((w) => w.hour * 60 + w.minute);
    expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
    expect(windows[0]).toMatchObject({ category: 'commute', hour: 8 });
  });

  it('drops windows that fall inside quiet hours', () => {
    const quiet: QuietHours = {
      start: { hour: 16, minute: 0 },
      end: { hour: 23, minute: 0 },
    };
    const windows = buildTriggerWindows(['work_break', 'commute'], quiet);
    // 17:00 (work) and 18:00 (commute) are suppressed → 3 remain.
    expect(windows).toHaveLength(3);
    expect(windows.every((w) => w.hour < 16)).toBe(true);
  });
});

describe('situationalOffsets', () => {
  it('spaces support pings across the window', () => {
    expect(situationalOffsets(3, 45)).toEqual([45, 90, 135, 180]);
  });
});
