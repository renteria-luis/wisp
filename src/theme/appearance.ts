import { colorScheme } from 'nativewind';

import { useSettings } from '@/store/useSettings';

export type ThemePref = 'system' | 'light' | 'dark' | 'pink';

/** NativeWind only knows light/dark/system — Pink rides on the light scheme and
 *  is re-tinted at the root (see app/_layout.tsx). */
function schemeFor(pref: ThemePref): 'system' | 'light' | 'dark' {
  return pref === 'pink' ? 'light' : pref;
}

/** Persist the appearance preference and apply it to NativeWind immediately. */
export function applyTheme(pref: ThemePref): void {
  useSettings.getState().setTheme(pref);
  colorScheme.set(schemeFor(pref));
}

/** Apply the saved preference (call once on launch, before first paint settles). */
export function applySavedTheme(): void {
  colorScheme.set(schemeFor(useSettings.getState().theme));
}
