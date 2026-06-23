/**
 * Cosmetics catalog + daily rotation (PROJECT.md §7.4). Pure.
 *
 * The daily-rotating set is chosen deterministically from the date (a PRNG
 * seeded by `YYYY-MM-DD`), so it's fully offline and identical on every device
 * for a given day.
 */
import type { Cosmetic } from '@/types/domain';

export const COSMETICS: Cosmetic[] = [
  // Characters — the companion's silhouette. `char_wisp` is the free default
  // (lets you switch back); the rest are premium unlockables. `swatch` is the
  // creature's signature tint, shown on its shop glyph.
  { id: 'char_wisp', type: 'character', price: 0, swatch: '#6f9d74' },
  { id: 'char_cat', type: 'character', price: 200, swatch: '#9aa0ab' },
  { id: 'char_bunny', type: 'character', price: 220, swatch: '#e9d8c5' },
  { id: 'char_bird', type: 'character', price: 240, swatch: '#f0b94d' },
  { id: 'char_fox', type: 'character', price: 300, swatch: '#e07a3c' },
  { id: 'char_axolotl', type: 'character', price: 350, swatch: '#f1a2b8' },
  { id: 'color_sage', type: 'companion_color', price: 0, swatch: '#6f9d74' },
  { id: 'color_peach', type: 'companion_color', price: 80, swatch: '#f5934d' },
  { id: 'color_sky', type: 'companion_color', price: 80, swatch: '#5b8aa6' },
  {
    id: 'color_lavender',
    type: 'companion_color',
    price: 120,
    swatch: '#9b8fc7',
  },
  { id: 'color_rose', type: 'companion_color', price: 120, swatch: '#d98a9e' },
  { id: 'color_mint', type: 'companion_color', price: 150, swatch: '#7fc7a8' },
  { id: 'acc_bow', type: 'accessory', price: 100, swatch: '#db5f1a' },
  { id: 'acc_scarf', type: 'accessory', price: 140, swatch: '#5b8aa6' },
  { id: 'acc_flower', type: 'accessory', price: 180, swatch: '#7aa37f' },
  { id: 'room_plant', type: 'room', price: 90, swatch: '#558b5f' },
  { id: 'room_lamp', type: 'room', price: 110, swatch: '#e0a04b' },
  { id: 'room_rug', type: 'room', price: 160, swatch: '#b54817' },
  { id: 'palette_sunset', type: 'palette', price: 200, swatch: '#f07a2c' },
  { id: 'palette_forest', type: 'palette', price: 220, swatch: '#38563d' },
];

export const ROTATION_SIZE = 4;

export function cosmeticById(id: string): Cosmetic | undefined {
  return COSMETICS.find((c) => c.id === id);
}

function hashDate(dateISO: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateISO.length; i++) {
    h ^= dateISO.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A deterministic subset of the catalog for the given day. Same date → same
 * selection, everywhere, offline.
 */
export function dailyRotation(
  dateISO: string,
  count = ROTATION_SIZE,
): Cosmetic[] {
  const rng = mulberry32(hashDate(dateISO));
  const pool = [...COSMETICS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = pool[i]!;
    const b = pool[j]!;
    pool[i] = b;
    pool[j] = a;
  }
  return pool.slice(0, Math.min(count, pool.length));
}
