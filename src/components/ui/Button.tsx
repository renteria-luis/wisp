import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '@/theme/useThemeColors';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
};

const container: Record<Variant, string> = {
  primary: 'bg-primary-500 active:opacity-90',
  secondary: 'bg-primary-100 active:opacity-80 dark:bg-primary-900',
  ghost: 'bg-transparent active:opacity-60',
};

const labelColor: Record<Variant, string> = {
  primary: 'text-ink-invert',
  secondary: 'text-primary-700 dark:text-primary-100',
  ghost: 'text-ink-soft dark:text-neutral-300',
};

export function Button({ label, onPress, variant = 'primary', disabled }: Props) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      className={`items-center justify-center overflow-hidden rounded-xl px-5 py-4 ${container[variant]} ${disabled ? 'opacity-40' : ''}`}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[colors.primary['400'], colors.primary['600']]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Text className={`text-base font-semibold ${labelColor[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}
