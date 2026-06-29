import { beforeEach, describe, expect, it } from '@jest/globals';

import { useCelebration } from '../useCelebration';

describe('useCelebration', () => {
  beforeEach(() => useCelebration.getState().dismiss());

  it('starts with nothing showing', () => {
    expect(useCelebration.getState().current).toBeNull();
  });

  it('celebrate() shows a burst and dismiss() clears it', () => {
    useCelebration.getState().celebrate('🎉', 'Nice work!');
    expect(useCelebration.getState().current).toEqual({
      emoji: '🎉',
      message: 'Nice work!',
    });
    useCelebration.getState().dismiss();
    expect(useCelebration.getState().current).toBeNull();
  });
});
