import { Pressable, Text } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/store/useSettings';
import { applyTheme } from '@/theme/appearance';

/** Cycles the appearance: light ☀️ → dark 🌙 → pink 💗 → light. Available from
 *  onboarding onward so the theme can be changed right away. */
export function ThemeToggle() {
  // The effective scheme already resolves the default 'system' preference, so
  // the cycle can't stutter on the first tap; Pink is the one flavour that
  // isn't a scheme, so it's read straight off the preference.
  const scheme = useColorScheme();
  const theme = useSettings((s) => s.theme);
  const current = theme === 'pink' ? 'pink' : scheme;

  const next =
    current === 'light' ? 'dark' : current === 'dark' ? 'pink' : 'light';
  const icon = current === 'pink' ? '💗' : current === 'dark' ? '🌙' : '☀️';

  return (
    <Pressable
      onPress={() => applyTheme(next)}
      accessibilityRole="button"
      accessibilityLabel="theme"
      hitSlop={8}
      className="px-2 py-1"
    >
      <Text className="text-xl">{icon}</Text>
    </Pressable>
  );
}
