import { useColorScheme as useNativewindColorScheme } from 'nativewind';

/**
 * Effective light/dark scheme. Sourced from NativeWind so a manual override
 * (Settings → Appearance) drives both `dark:` classes and the nav theme.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useNativewindColorScheme().colorScheme ?? 'light';
}
