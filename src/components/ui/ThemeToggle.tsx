import { Pressable, Text } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/store/useSettings';
import { applyTheme } from '@/theme/appearance';

/** Cycles the appearance: light ☀️ → dark 🌙 → pink 💗 → light. Available from
 *  onboarding onward so the theme can be changed right away. */
export function ThemeToggle() {
  const scheme = useColorScheme();
  const theme = useSettings((s) => s.theme);
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'pink' : 'light';
  const icon = theme === 'pink' ? '💗' : scheme === 'dark' ? '🌙' : '☀️';
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
