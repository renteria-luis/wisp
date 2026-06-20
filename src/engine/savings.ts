/**
 * Money-saved math (PROJECT.md §6.8). Pure.
 *
 * Savings are measured against the pre-program baseline: every cigarette not
 * smoked relative to that baseline is money kept. Never negative on a heavy day.
 */

export function pricePerCigarette(
  packPrice: number,
  cigsPerPack: number,
): number {
  if (cigsPerPack <= 0) return 0;
  return packPrice / cigsPerPack;
}

/** Total cigarettes avoided vs `baseline`, clamped at 0 per day. */
export function cigarettesAvoided(
  baseline: number,
  actualDaily: number[],
): number {
  return actualDaily.reduce((sum, a) => sum + Math.max(0, baseline - a), 0);
}

export interface SavingsParams {
  baseline: number;
  actualDaily: number[];
  packPrice: number;
  cigsPerPack: number;
}

export function moneySaved({
  baseline,
  actualDaily,
  packPrice,
  cigsPerPack,
}: SavingsParams): number {
  return (
    cigarettesAvoided(baseline, actualDaily) *
    pricePerCigarette(packPrice, cigsPerPack)
  );
}

/** Cumulative money saved per day — powers the savings-over-time chart. */
export function savingsSeries({
  baseline,
  actualDaily,
  packPrice,
  cigsPerPack,
}: SavingsParams): number[] {
  const perCig = pricePerCigarette(packPrice, cigsPerPack);
  const out: number[] = [];
  let cumulative = 0;
  for (const a of actualDaily) {
    cumulative += Math.max(0, baseline - a) * perCig;
    out.push(cumulative);
  }
  return out;
}
