import { describe, expect, it } from '@jest/globals';

import { topHelped } from '../useDistractions';

describe('topHelped', () => {
  it('orders ids by how much they helped (most first) and drops zeros', () => {
    expect(topHelped({ walk: 3, water: 1, gum: 0, music: 5 })).toEqual([
      'music',
      'walk',
      'water',
    ]);
  });

  it('is empty when nothing has helped yet', () => {
    expect(topHelped({})).toEqual([]);
  });
});
