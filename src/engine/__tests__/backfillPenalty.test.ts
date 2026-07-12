import {
  backfillPenaltyHours,
  cigarettePenaltyHours,
  COLD_TURKEY_HOURS,
  WITHIN_QUOTA_HOURS,
} from '../health';

/**
 * Backfilling a day you forgot to log must cost exactly what living it honestly
 * would have cost. Cheaper, and the log becomes a place to hide; dearer, and the
 * app punishes you for being honest late. These pin it to "exactly".
 */
describe('backfillPenaltyHours', () => {
  it('costs the same as logging them one by one, as they happened', () => {
    const allowance = 10;
    const oneByOne =
      cigarettePenaltyHours(0, allowance) +
      cigarettePenaltyHours(1, allowance) +
      cigarettePenaltyHours(2, allowance);
    expect(backfillPenaltyHours(0, 3, allowance)).toBeCloseTo(oneByOne);
  });

  it('charges more when the day already had cigarettes on it', () => {
    const allowance = 4;
    const ontoEmpty = backfillPenaltyHours(0, 2, allowance); // the 1st and 2nd
    const ontoBusy = backfillPenaltyHours(3, 2, allowance); // the 4th and 5th
    expect(ontoBusy).toBeGreaterThan(ontoEmpty);
  });

  it('escalates once the day’s line is crossed, and keeps escalating', () => {
    const allowance = 3;
    const unit = WITHIN_QUOTA_HOURS / allowance;
    // Three cigarettes on an empty day sit inside the quota: flat rate.
    expect(backfillPenaltyHours(0, 3, allowance)).toBeCloseTo(unit * 3);
    // The next one is over the line and costs more than an in-quota one…
    const first = backfillPenaltyHours(3, 1, allowance);
    expect(first).toBeGreaterThan(unit);
    // …and the one after that costs more again.
    const second = backfillPenaltyHours(4, 1, allowance);
    expect(second).toBeGreaterThan(first);
  });

  it('prices an old day by THAT day’s allowance, not today’s', () => {
    // Same three cigarettes, judged against a generous early quota and a tight
    // late one. The taper must not turn a fine day back then into a bad one.
    const early = backfillPenaltyHours(0, 3, 12);
    const late = backfillPenaltyHours(0, 3, 3);
    expect(late).toBeGreaterThan(early);
  });

  it('adds no surcharge for recording several at once', () => {
    // Three at a time means three happened that day — not three in one go. The
    // total must not depend on how the user chose to enter them.
    const allowance = 5;
    const inOneGo = backfillPenaltyHours(0, 3, allowance);
    const inSteps =
      backfillPenaltyHours(0, 1, allowance) +
      backfillPenaltyHours(1, 1, allowance) +
      backfillPenaltyHours(2, 1, allowance);
    expect(inOneGo).toBeCloseTo(inSteps);
  });

  it('treats every cigarette as a slip on cold turkey, escalating', () => {
    const two = backfillPenaltyHours(0, 2, 0);
    expect(two).toBeGreaterThan(COLD_TURKEY_HOURS * 2); // the 2nd stings more
  });

  it('costs nothing when nothing is added', () => {
    expect(backfillPenaltyHours(2, 0, 10)).toBe(0);
    expect(backfillPenaltyHours(0, -1, 10)).toBe(0);
  });
});
