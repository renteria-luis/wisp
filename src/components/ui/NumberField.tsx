import { Text, TextInput, View } from 'react-native';

import { colors } from '@/theme/tokens';

type Props = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  decimal?: boolean;
  suffix?: string;
};

function parseNumber(text: string, decimal: boolean): number | null {
  const cleaned = text.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, '');
  if (cleaned === '') return null;
  const n = decimal ? Number.parseFloat(cleaned) : Number.parseInt(cleaned, 10);
  return Number.isNaN(n) ? null : n;
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  decimal = false,
  suffix,
}: Props) {
  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-ink-soft dark:text-neutral-300">
        {label}
      </Text>
      <View className="flex-row items-center rounded-xl border border-neutral-200 bg-neutral-0 px-4 dark:border-neutral-800 dark:bg-neutral-900">
        <TextInput
          value={value == null ? '' : String(value)}
          onChangeText={(t) => onChange(parseNumber(t, decimal))}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          placeholder={placeholder}
          placeholderTextColor={colors.ink.mute}
          className="flex-1 py-3 text-base text-ink dark:text-neutral-50"
        />
        {suffix ? (
          <Text className="pl-2 text-sm text-ink-mute dark:text-neutral-400">
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
