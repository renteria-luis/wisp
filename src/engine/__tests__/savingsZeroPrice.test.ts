import { moneySaved, savingsSeries, pricePerCigarette } from '@/engine/savings';

/**
 * A missing pack price silently zeroed every saving forever (onboarding let you
 * skip the field). The math below is correct — it is the *setup* that must never
 * be allowed to reach it, and the UI must never report a bare "0.00" for it.
 */
describe('savings with no pack price', () => {
  const cut = { baseline: 10, actualDaily: [2, 3, 1], cigsPerPack: 20 };

  it('is identically zero when the pack price is missing — however well you do', () => {
    expect(pricePerCigarette(0, 20)).toBe(0);
    expect(moneySaved({ ...cut, packPrice: 0 })).toBe(0);
    expect(savingsSeries({ ...cut, packPrice: 0 })).toEqual([0, 0, 0]);
  });

  it('accrues normally as soon as a price exists', () => {
    // 10/pack ÷ 20 = 0.50 per cigarette; avoided = 8 + 7 + 9 = 24 → 12.00
    expect(moneySaved({ ...cut, packPrice: 10 })).toBeCloseTo(12);
    expect(savingsSeries({ ...cut, packPrice: 10 })).toEqual([4, 7.5, 12]);
  });
});
