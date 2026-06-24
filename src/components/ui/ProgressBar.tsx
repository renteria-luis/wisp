import { View } from 'react-native';

type Props = {
  /** 0..1 fill fraction. */
  progress: number;
  height?: number;
};

/** A simple rounded progress bar (flex-based so it needs no measured width). */
export function ProgressBar({ progress, height = 8 }: Props) {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={{ height }}
      className="flex-row overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
    >
      <View
        style={{ flex: Math.max(0.0001, p) }}
        className="rounded-full bg-primary-400"
      />
      <View style={{ flex: Math.max(0.0001, 1 - p) }} />
    </View>
  );
}
