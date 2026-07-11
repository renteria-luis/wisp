import { useEffect, useState } from 'react';
import { Keyboard, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { inputText } from '@/theme/inputText';
import { colors } from '@/theme/tokens';

type Props = {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  decimal?: boolean;
  suffix?: string;
  /** Show an "OK" button that dismisses the keyboard (for fields on non-scrolling
   *  screens where the button shouldn't shift the layout). */
  showDone?: boolean;
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
  showDone = false,
}: Props) {
  // Keep a local text buffer so a decimal point (e.g. "9.") isn't swallowed
  // while typing, while still syncing when `value` changes externally.
  const [text, setText] = useState(value == null ? '' : String(value));
  useEffect(() => {
    if (parseNumber(text, decimal) !== value) {
      setText(value == null ? '' : String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handle = (next: string) => {
    setText(next);
    onChange(parseNumber(next, decimal));
  };

  return (
    <View>
      <Text className="mb-1 text-sm font-medium text-ink-soft dark:text-neutral-300">
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        <View className="flex-1 flex-row items-center rounded-xl border border-neutral-200 bg-neutral-0 px-4 dark:border-neutral-800 dark:bg-neutral-900">
          <TextInput
            value={text}
            onChangeText={handle}
            keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
            placeholder={placeholder}
            placeholderTextColor={colors.ink.mute}
            textAlignVertical="center"
            style={[{ height: 46 }, inputText]}
            className="flex-1 text-base text-ink dark:text-neutral-50"
          />
          {suffix ? (
            <Text className="pl-2 text-sm text-ink-mute dark:text-neutral-400">
              {suffix}
            </Text>
          ) : null}
        </View>
        {showDone ? (
          <Button label="OK" size="sm" onPress={() => Keyboard.dismiss()} />
        ) : null}
      </View>
    </View>
  );
}
