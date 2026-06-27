import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { pickRandom } from '@/content/distractions';
import { topHelped, useDistractions } from '@/store/useDistractions';

const SHOWN = 5;

type Props = {
  /** The distraction the user picked to try (highlighted). */
  selected: string | null;
  onSelect: (id: string) => void;
};

/** Random distraction suggestions: pick one to try, shuffle for others, and see
 *  what's worked for you before (sorted by what helps most). */
export function Distraction({ selected, onSelect }: Props) {
  const { t } = useTranslation();
  const helped = useDistractions((s) => s.helped);
  const [picks, setPicks] = useState<string[]>(() => pickRandom(SHOWN));
  const [showWorked, setShowWorked] = useState(false);
  const worked = topHelped(helped);

  return (
    <View className="gap-4 py-2">
      <Text className="text-center text-base leading-6 text-ink-soft dark:text-neutral-300">
        {t('craving.distraction.intro')}
      </Text>

      <View className="gap-2">
        {picks.map((id) => {
          const isSel = selected === id;
          return (
            <Pressable
              key={id}
              onPress={() => onSelect(id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSel }}
              className={`rounded-xl border px-4 py-3 ${
                isSel
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                  : 'border-neutral-200 bg-neutral-0 dark:border-neutral-800 dark:bg-neutral-900'
              }`}
            >
              <Text
                className={`text-base ${isSel ? 'font-semibold text-primary-700 dark:text-primary-100' : 'text-ink dark:text-neutral-50'}`}
              >
                {isSel ? '✓ ' : ''}
                {t(`craving.distraction.items.${id}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={() => setPicks(pickRandom(SHOWN, picks))}
        accessibilityRole="button"
        className="items-center py-1"
      >
        <Text className="text-sm font-medium text-primary-600">
          {t('craving.distraction.more')}
        </Text>
      </Pressable>

      {worked.length > 0 ? (
        <View className="border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <Pressable
            onPress={() => setShowWorked((v) => !v)}
            accessibilityRole="button"
            className="flex-row items-center justify-between"
          >
            <Text className="text-sm font-semibold text-ink dark:text-neutral-50">
              {t('craving.distraction.whatWorked')}
            </Text>
            <Text className="text-xs text-ink-mute dark:text-neutral-400">
              {showWorked ? '▾' : '▸'}
            </Text>
          </Pressable>
          {showWorked ? (
            <View className="mt-2 gap-1">
              {worked.slice(0, 8).map((id, i) => (
                <View
                  key={id}
                  className="flex-row items-center justify-between"
                >
                  <Text className="flex-1 pr-2 text-sm text-ink-soft dark:text-neutral-300">
                    {i === 0 ? '⭐ ' : ''}
                    {t(`craving.distraction.items.${id}`)}
                  </Text>
                  <Text className="text-xs text-ink-mute dark:text-neutral-400">
                    ×{helped[id]}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
