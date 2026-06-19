/**
 * Tailwind / NativeWind config.
 *
 * Colors are sourced from the SAME `palette.json` that `src/theme/tokens.ts`
 * consumes, so design tokens and utility classes never drift.
 */
const palette = require('./src/theme/palette.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: palette.primary,
        accent: palette.accent,
        neutral: palette.neutral,
        ink: palette.ink,
        cream: palette.cream,
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
