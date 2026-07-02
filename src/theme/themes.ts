import palette from './palette.json';

/**
 * The Pink theme — a soft pastel rose/pink/fuchsia re-skin. It reuses the light
 * theme's structure (neutrals, ink, white cards) and only swaps the accent
 * families + background. Two channels stay in sync from here:
 *  - NativeWind classes (bg-primary-500, text-accent-600, bg-cream…) via CSS
 *    variables that `app/_layout.tsx` overrides with `vars(PINK_VARS)`.
 *  - Inline JS colours (gradients, charts) via `useThemeColors()`.
 */
export const PINK_PALETTE = {
  primary: {
    '50': '#fdf2f8',
    '100': '#fce7f3',
    '200': '#fbcfe8',
    '300': '#f9a8d4',
    '400': '#f472b6',
    '500': '#ec4899',
    '600': '#db2777',
    '700': '#be185d',
    '800': '#9d174d',
    '900': '#831843',
  },
  secondary: {
    '50': '#fdf4ff',
    '100': '#fae8ff',
    '200': '#f5d0fe',
    '300': '#f0abfc',
    '400': '#e879f9',
    '500': '#d946ef',
    '600': '#c026d3',
    '700': '#a21caf',
    '800': '#86198f',
    '900': '#701a75',
  },
  accent: {
    '50': '#fff1f2',
    '100': '#ffe4e6',
    '200': '#fecdd3',
    '300': '#fda4af',
    '400': '#fb7185',
    '500': '#f43f5e',
    '600': '#e11d48',
    '700': '#be123c',
    '800': '#9f1239',
    '900': '#881337',
  },
  cream: '#fdf4fa',
} as const;

export type ThemeColors = typeof palette;

/** Full colour set for inline styles, given whether the Pink theme is active. */
export function themeColors(pink: boolean): ThemeColors {
  if (!pink) return palette;
  return {
    ...palette,
    primary: PINK_PALETTE.primary,
    secondary: PINK_PALETTE.secondary,
    accent: PINK_PALETTE.accent,
    cream: PINK_PALETTE.cream,
  };
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ].join(' ');
}

type VarSource = {
  primary: Record<string, string>;
  secondary: Record<string, string>;
  accent: Record<string, string>;
  cream: string;
};

function varsInput(source: VarSource): Record<string, string> {
  const out: Record<string, string> = {};
  for (const fam of ['primary', 'secondary', 'accent'] as const) {
    for (const [shade, hex] of Object.entries(source[fam])) {
      out[`--color-${fam}-${shade}`] = hexToRgb(hex);
    }
  }
  out['--color-cream'] = hexToRgb(source.cream);
  return out;
}

/** CSS-variable values for the Pink theme (fed to NativeWind's `vars()`). */
export function pinkVarsInput(): Record<string, string> {
  return varsInput(PINK_PALETTE);
}

/** The default (light/dark) values — applied so the variable scope is ALWAYS
 *  present, so toggling to/from Pink only changes values and never inserts or
 *  removes a context provider (which would remount the navigator and crash). */
export function defaultVarsInput(): Record<string, string> {
  return varsInput(palette);
}
