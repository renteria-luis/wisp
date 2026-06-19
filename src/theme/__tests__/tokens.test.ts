import { describe, expect, it } from '@jest/globals';

import { colors, spacing, tokens, vitalityBands } from '../tokens';

describe('design tokens', () => {
  it('exposes a full primary color scale as hex', () => {
    const shades = [
      '50',
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
    ] as const;
    for (const shade of shades) {
      expect(colors.primary[shade]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('uses a 4px-based spacing scale', () => {
    expect(spacing.xs).toBe(4);
    expect(spacing.md).toBe(12);
    expect(spacing.xl).toBe(24);
  });

  it('covers the full 0–100 vitality range', () => {
    expect(vitalityBands[0]?.max).toBe(25);
    const last = vitalityBands[vitalityBands.length - 1];
    expect(last?.max).toBe(100);
  });

  it('default export bundles the color palette', () => {
    expect(tokens.colors).toBe(colors);
  });
});
