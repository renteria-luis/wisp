import { describe, expect, it } from '@jest/globals';

import { computeVitality, vitalityBand } from '../vitality';

describe('computeVitality', () => {
  it('is radiant for a long smoke-free stretch under target', () => {
    expect(
      computeVitality({
        recentCigarettes: 0,
        recentTarget: 0,
        hoursSinceLastCigarette: 60,
      }),
    ).toBeGreaterThanOrEqual(76);
  });

  it('bottoms out for heavy recent smoking over target', () => {
    expect(
      computeVitality({
        recentCigarettes: 20,
        recentTarget: 5,
        hoursSinceLastCigarette: 0,
      }),
    ).toBe(0);
  });

  it('always stays within 0..100', () => {
    expect(
      computeVitality({
        recentCigarettes: 100,
        recentTarget: 0,
        hoursSinceLastCigarette: 0,
      }),
    ).toBe(0);
    expect(
      computeVitality({
        recentCigarettes: 0,
        recentTarget: 10,
        hoursSinceLastCigarette: 1000,
      }),
    ).toBe(100);
  });
});

describe('vitalityBand', () => {
  it('maps scores to the four bands at the right thresholds', () => {
    expect(vitalityBand(10)).toBe('exhausted');
    expect(vitalityBand(25)).toBe('exhausted');
    expect(vitalityBand(26)).toBe('tired');
    expect(vitalityBand(50)).toBe('tired');
    expect(vitalityBand(51)).toBe('okay');
    expect(vitalityBand(75)).toBe('okay');
    expect(vitalityBand(76)).toBe('radiant');
  });
});
