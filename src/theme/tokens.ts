/**
 * Design tokens — the single source of truth for Wisp's visual language.
 *
 * Colors live in `palette.json` so they can be shared verbatim with
 * `tailwind.config.js` (which `require`s the same JSON). Everything here is
 * plain data with no React/Native imports, so it is safe to use from the
 * engine, charts (raw SVG fills), and NativeWind classes alike.
 *
 * Mood (PROJECT.md §17): warm, cozy, calm, encouraging. Calm sage primary,
 * warm cream surfaces, soft peach/amber accent, muted ink text.
 */
import palette from './palette.json';

export const colors = palette;

/** 4px base spacing scale. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

/** Corner radii — soft, rounded shapes throughout. */
export const radii = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  pill: 999,
  full: 9999,
} as const;

/** Type scale (in px) and weights. System font for now; custom fonts later. */
export const typography = {
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  lineHeight: {
    tight: 1.15,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.65,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

/** Soft, kind elevation (ease-out, no harsh shadows). */
export const shadow = {
  card: {
    shadowColor: palette.neutral['900'],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

/** Motion timings (ms) — subtle and gentle. */
export const motion = {
  fast: 150,
  base: 250,
  slow: 400,
  idle: 4000,
} as const;

/**
 * Vitality band → companion state mapping (PROJECT.md §6.4).
 * Used to pick the companion's palette/expression from a 0–100 score.
 */
export const vitalityBands = [
  { max: 25, key: 'exhausted', color: palette.vitality.low },
  { max: 50, key: 'tired', color: palette.vitality.mid },
  { max: 75, key: 'okay', color: palette.vitality.ok },
  { max: 100, key: 'radiant', color: palette.vitality.high },
] as const;

export type VitalityState = (typeof vitalityBands)[number]['key'];

export const tokens = {
  colors,
  spacing,
  radii,
  typography,
  shadow,
  motion,
  vitalityBands,
} as const;

export type Tokens = typeof tokens;
