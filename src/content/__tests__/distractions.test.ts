import { describe, expect, it } from '@jest/globals';

import { DISTRACTIONS, pickRandom } from '../distractions';

describe('distraction catalog', () => {
  it('is large and free of duplicates', () => {
    expect(DISTRACTIONS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(DISTRACTIONS).size).toBe(DISTRACTIONS.length);
  });
});

describe('pickRandom', () => {
  it('returns n distinct ids that all exist in the catalog', () => {
    const picks = pickRandom(5);
    expect(picks).toHaveLength(5);
    expect(new Set(picks).size).toBe(5);
    for (const id of picks) expect(DISTRACTIONS).toContain(id);
  });

  it('avoids excluded ids while the pool stays big enough', () => {
    const exclude = pickRandom(5);
    const next = pickRandom(5, exclude);
    expect(next.every((id) => !exclude.includes(id))).toBe(true);
  });
});
