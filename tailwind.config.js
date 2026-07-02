/**
 * Tailwind / NativeWind config.
 *
 * Colors are sourced from the SAME `palette.json` that `src/theme/tokens.ts`
 * consumes, so design tokens and utility classes never drift.
 */
const palette = require('./src/theme/palette.json');

// primary/secondary/accent/cream are driven by CSS variables (defaults in
// src/global.css) so the Pink theme can override them at runtime via vars();
// light/dark keep the palette defaults. neutral/ink/etc. stay static.
const varScale = (name) =>
  Object.fromEntries(
    Object.keys(palette[name]).map((shade) => [
      shade,
      `rgb(var(--color-${name}-${shade}) / <alpha-value>)`,
    ]),
  );

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: varScale('primary'),
        secondary: varScale('secondary'),
        accent: varScale('accent'),
        neutral: palette.neutral,
        ink: palette.ink,
        cream: 'rgb(var(--color-cream) / <alpha-value>)',
        vitality: palette.vitality,
        feedback: palette.feedback,
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
      },
      fontFamily: {
        sans: ['System'],
        rounded: ['System'],
      },
    },
  },
  plugins: [],
};
