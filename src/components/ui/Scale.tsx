import { Pressable, Text, View } from 'react-native';

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

/** A compact 0–N selectable scale (used for readiness/confidence). */
export function Scale({ value, onChange, min = 0, max = 10 }: Props) {
  const items: number[] = [];
  for (let n = min; n <= max; n++) items.push(n);

  return (
    <View className="flex-row flex-wrap gap-2">
      {items.map((n) => {
        const selected = n === value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`h-10 w-10 items-center justify-center rounded-full border ${
              selected
                ? 'border-primary-500 bg-primary-500'
                : 'border-neutral-200 bg-neutral-0'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                selected ? 'text-ink-invert' : 'text-ink-soft'
              }`}
            >
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
