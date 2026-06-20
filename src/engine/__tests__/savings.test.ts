import { describe, expect, it } from '@jest/globals';

import {
  cigarettesAvoided,
  moneySaved,
  pricePerCigarette,
  savingsSeries,
} from '../savings';

describe('pricePerCigarette', () => {
  it('divides pack price by pack size', () => {
    expect(pricePerCigarette(10, 20)).toBe(0.5);
  });
  it('guards against a zero pack size', () => {
    expect(pricePerCigarette(10, 0)).toBe(0);
  });
});

describe('cigarettesAvoided', () => {
  it('sums baseline minus actual, never negative on a heavy day', () => {
    expect(cigarettesAvoided(5, [5, 3, 0])).toBe(7); // 0 + 2 + 5
    expect(cigarettesAvoided(5, [7])).toBe(0); // over baseline → 0, not -2
  });
});

describe('moneySaved & savingsSeries', () => {
  it('multiplies avoided cigarettes by price per cigarette', () => {
    expect(
      moneySaved({
        baseline: 5,
        actualDaily: [0, 0],
        packPrice: 10,
        cigsPerPack: 20,
      }),
    ).toBe(5); // 10 avoided * 0.5
  });

  it('produces a non-decreasing cumulative series', () => {
    const series = savingsSeries({
      baseline: 4,
      actualDaily: [2, 0, 4],
      packPrice: 10,
      cigsPerPack: 20,
    });
    // perCig = 0.5; avoided/day = [2,4,0] → cumulative 1, 3, 3
    expect(series).toEqual([1, 3, 3]);
  });
});
