import { describe, expect, it } from '@jest/globals';

import {
  accrueCoins,
  BASE_RATE,
  MAX_RATE,
  ratePerHour,
  RECOVERY_MULT_CAP,
  recoveryMultiplier,
  STEP_HOURS,
} from '../economy';

describe('recoveryMultiplier', () => {
  it('is 1× at the start and grows with milestones reached', () => {
    expect(recoveryMultiplier(0)).toBe(1);
    expect(recoveryMultiplier(5)).toBeGreaterThan(recoveryMultiplier(2));
  });

  it('is capped so the economy never runs away', () => {
    expect(recoveryMultiplier(1000)).toBe(RECOVERY_MULT_CAP);
  });
});

describe('ratePerHour', () => {
  it('starts at BASE_RATE and steps up ~15% per day', () => {
    expect(ratePerHour(0)).toBe(BASE_RATE);
    expect(ratePerHour(STEP_HOURS)).toBeCloseTo(BASE_RATE * 1.15);
    expect(ratePerHour(STEP_HOURS * 2)).toBeCloseTo(BASE_RATE * 1.15 * 1.15);
  });

  it('caps at MAX_RATE', () => {
    expect(ratePerHour(10000)).toBe(MAX_RATE);
  });
});

describe('accrueCoins', () => {
  it('accrues the base rate across the first day', () => {
    expect(accrueCoins(0, 24)).toBeCloseTo(BASE_RATE * 24); // 120
  });

  it('rewards a longer streak with a higher rate', () => {
    const firstDay = accrueCoins(0, 24);
    const secondDay = accrueCoins(24, 24);
    expect(secondDay).toBeGreaterThan(firstDay);
    expect(secondDay).toBeCloseTo(BASE_RATE * 1.15 * 24); // 138
  });

  it('returns 0 for non-positive elapsed time', () => {
    expect(accrueCoins(50, 0)).toBe(0);
  });
});
