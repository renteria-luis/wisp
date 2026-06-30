import { describe, expect, it } from '@jest/globals';

import { nowISO, todayISO } from '../date';

describe('nowISO', () => {
  it("date portion always equals the local calendar day, every hour", () => {
    // Logged rows are bucketed by substr(timestamp,1,10) and queried with
    // todayISO(); these MUST agree at every hour and in any timezone, or an
    // evening log lands on "tomorrow" (UTC) and never counts toward today.
    for (let h = 0; h < 24; h++) {
      const d = new Date(2026, 5, 28, h, 30, 15, 500); // local wall-clock
      expect(nowISO(d).slice(0, 10)).toBe(todayISO(d));
    }
  });

  it('is a timezone-naive local datetime (no Z suffix)', () => {
    const d = new Date(2026, 5, 28, 20, 0, 0);
    expect(nowISO(d)).toMatch(/^2026-06-28T/);
    expect(nowISO(d)).not.toMatch(/Z$/);
  });
});
