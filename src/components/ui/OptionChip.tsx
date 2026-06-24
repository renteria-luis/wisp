import { Pressable, Text } from 'react-native';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`rounded-full border px-4 py-2 ${
        selected
          ? 'border-primary-500 bg-primary-100 dark:bg-primary-900'
          : 'border-neutral-200 bg-neutral-0 dark:border-neutral-800 dark:bg-neutral-900'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          selected
            ? 'text-primary-700 dark:text-primary-100'
            : 'text-ink-soft dark:text-neutral-300'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
