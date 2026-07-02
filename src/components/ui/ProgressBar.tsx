import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

type Props = {
  /** 0..1 fill fraction. */
  progress: number;
  height?: number;
  /** Optional [from, to] gradient override. */
  gradient?: readonly [string, string];
};

/** A rounded progress bar with a vivid gradient fill (flex-based, no measuring). */
export function ProgressBar({ progress, height = 8, gradient }: Props) {
  const colors = useThemeColors();
  const p = Math.max(0, Math.min(1, progress));
  const stops = gradient ?? [colors.primary['400'], colors.secondary['500']];
  return (
    <View
      style={{ height }}
      className="flex-row overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
    >
      <LinearGradient
        colors={stops}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: Math.max(0.0001, p) }}
      />
      <View style={{ flex: Math.max(0.0001, 1 - p) }} />
    </View>
  );
}
