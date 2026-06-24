import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

const ITEMS = ['water', 'walk', 'text', 'gum', 'music', 'stretch'] as const;
const SHOWN = 3;

/** A few quick, rotating distraction suggestions to ride out the urge. */
export function Distraction() {
  const { t } = useTranslation();
  const [seed, setSeed] = useState(0);

  const picks = Array.from(
    { length: SHOWN },
    (_, i) => ITEMS[(seed + i) % ITEMS.length]!,
  );

  return (
    <View className="gap-4 py-4">
      <Text className="text-center text-base leading-6 text-ink-soft dark:text-neutral-300">
        {t('craving.distraction.intro')}
      </Text>
      <View className="gap-3">
        {picks.map((key) => (
          <View
            key={key}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 px-4 py-3"
          >
            <Text className="text-base text-ink dark:text-neutral-50">
              {t(`craving.distraction.items.${key}`)}
            </Text>
          </View>
        ))}
      </View>
      <Pressable
        onPress={() => setSeed((s) => s + SHOWN)}
        accessibilityRole="button"
        className="items-center py-2"
      >
        <Text className="text-sm font-medium text-primary-600">
          {t('craving.distraction.more')}
        </Text>
      </Pressable>
    </View>
  );
}
