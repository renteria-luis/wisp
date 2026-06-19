import { describe, expect, it } from '@jest/globals';

import en from '../locales/en.json';
import es from '../locales/es.json';

function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object'
      ? keyPaths(value as Record<string, unknown>, path)
      : [path];
  });
}

describe('locale parity', () => {
  it('es mirrors en key-for-key (no missing/extra translations)', () => {
    expect(keyPaths(es).sort()).toEqual(keyPaths(en).sort());
  });
});
