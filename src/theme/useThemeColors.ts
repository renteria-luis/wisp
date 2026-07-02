import { useSettings } from '@/store/useSettings';

import { themeColors, type ThemeColors } from './themes';

/**
 * Theme-aware colours for INLINE styles (gradients, SVG charts, tint props) —
 * the counterpart to NativeWind classes. Re-renders when the theme changes, so
 * inline colours track the Pink theme just like className colours do.
 */
export function useThemeColors(): ThemeColors {
  const theme = useSettings((s) => s.theme);
  return themeColors(theme === 'pink');
}
