import { describe, expect, it } from '@jest/globals';

import {
  COSMETICS,
  cosmeticById,
  dailyRotation,
  ROTATION_SIZE,
} from '../cosmetics';

describe('dailyRotation', () => {
  it('is deterministic for a given date', () => {
    const a = dailyRotation('2026-06-20').map((c) => c.id);
    const b = dailyRotation('2026-06-20').map((c) => c.id);
    expect(a).toEqual(b);
  });

  it('returns ROTATION_SIZE distinct catalog items', () => {
    const r = dailyRotation('2026-06-20');
    expect(r).toHaveLength(ROTATION_SIZE);
    expect(new Set(r.map((c) => c.id)).size).toBe(ROTATION_SIZE);
    for (const c of r) expect(COSMETICS).toContainEqual(c);
  });

  it('usually differs across dates', () => {
    const a = dailyRotation('2026-06-20')
      .map((c) => c.id)
      .join();
    const b = dailyRotation('2026-07-01')
      .map((c) => c.id)
      .join();
    expect(a).not.toEqual(b);
  });
});

describe('cosmeticById', () => {
  it('finds catalog items and returns undefined otherwise', () => {
    expect(cosmeticById('color_sage')?.type).toBe('companion_color');
    expect(cosmeticById('nope')).toBeUndefined();
  });
});
