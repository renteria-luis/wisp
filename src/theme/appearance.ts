import { colorScheme } from 'nativewind';

import { useSettings } from '@/store/useSettings';

export type ThemePref = 'system' | 'light' | 'dark';

/** Persist the appearance preference and apply it to NativeWind immediately. */
export function applyTheme(pref: ThemePref): void {
  useSettings.getState().setTheme(pref);
  colorScheme.set(pref);
}

/** Apply the saved preference (call once on launch, before first paint settles). */
export function applySavedTheme(): void {
  colorScheme.set(useSettings.getState().theme);
}
