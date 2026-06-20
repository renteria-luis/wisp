import { Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
};

const container: Record<Variant, string> = {
  primary: 'bg-primary-500 active:opacity-90',
  secondary: 'bg-primary-100 active:opacity-80',
  ghost: 'bg-transparent active:opacity-60',
};

const labelColor: Record<Variant, string> = {
  primary: 'text-ink-invert',
  secondary: 'text-primary-700',
  ghost: 'text-ink-soft',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      className={`items-center justify-center rounded-xl px-5 py-4 ${container[variant]} ${disabled ? 'opacity-40' : ''}`}
    >
      <Text className={`text-base font-semibold ${labelColor[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}
