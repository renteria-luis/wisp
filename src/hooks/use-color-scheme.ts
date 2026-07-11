import { useColorScheme as useDeviceColorScheme } from 'react-native';

import { useSettings } from '@/store/useSettings';

/**
 * Effective light/dark scheme, honouring the saved override (Pink rides on the
 * light scheme — same mapping as `schemeFor` in theme/appearance).
 *
 * Deliberately derived from React Native's Appearance hook + our own store, and
 * NOT from NativeWind's `useColorScheme`. NativeWind's version reads a style
 * signal and can write back to it as it is read; called from the middle of a
 * tree (Button, ThemeToggle, …) that notifies NativeWind-styled siblings which
 * have already rendered but not yet mounted — which is React's "Can't perform a
 * React state update on a component that hasn't mounted yet" warning. Reading
 * the preference ourselves gives the same answer with no signal write at all.
 *
 * NativeWind still drives the actual `dark:` classes — `applyTheme` writes to
 * its colorScheme. We only avoid *reading* that signal mid-render.
 */
export function useColorScheme(): 'light' | 'dark' {
  const device = useDeviceColorScheme();
  const theme = useSettings((s) => s.theme);
  if (theme === 'dark') return 'dark';
  if (theme === 'light' || theme === 'pink') return 'light';
  return device === 'dark' ? 'dark' : 'light';
}
