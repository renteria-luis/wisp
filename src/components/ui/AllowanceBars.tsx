import { Text, View } from 'react-native';

type Props = {
  allowances: number[];
  /** Number of leading days to show. */
  days?: number;
  /** Peak used to scale bar heights (defaults to the max allowance). */
  max?: number;
};

/**
 * Lightweight bar strip for a short allowance schedule. A stand-in for the
 * animated SVG charts that arrive in Phase 6.
 */
export function AllowanceBars({ allowances, days = 7, max }: Props) {
  const slice = allowances.slice(0, days);
  const peak = Math.max(1, max ?? Math.max(1, ...allowances));

  return (
    <View className="h-24 flex-row items-end gap-2">
      {slice.map((a, i) => (
        <View key={i} className="flex-1 items-center">
          <View
            style={{ height: Math.max(4, Math.round((a / peak) * 80)) }}
            className="w-full rounded-md bg-primary-400"
          />
          <Text className="mt-1 text-[10px] text-ink-mute">{a}</Text>
        </View>
      ))}
    </View>
  );
}
