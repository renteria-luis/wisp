import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { pickRandom } from '@/content/distractions';
import { Button } from '@/components/ui/Button';
import { topHelped, useDistractions } from '@/store/useDistractions';

const SHOWN = 4;

type Props = {
  /** The distraction the user picked to try (highlighted). */
  selected: string | null;
  onSelect: (id: string) => void;
  /** Log the resisted craving + close the toolkit (shared with the sheet button). */
  onResisted: () => void;
};

/** Random distraction suggestions: pick one to try, shuffle for others, and open
 *  "what worked for you" (a popup ranked by what helps most, with its own
 *  I-resisted button). */
export function Distraction({ selected, onSelect, onResisted }: Props) {
  const { t } = useTranslation();
  const helped = useDistractions((s) => s.helped);
  const [picks, setPicks] = useState<string[]>(() => pickRandom(SHOWN));
  const [workedOpen, setWorkedOpen] = useState(false);
  const worked = topHelped(helped);

  return (
    // No bottom padding: it was the widest part of the gap between the two
    // buttons below and the sheet's pinned "I resisted".
    <View className="gap-3 pt-1">
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

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button
            label={t('craving.distraction.more')}
            variant="secondary"
            onPress={() => setPicks(pickRandom(SHOWN, picks))}
          />
        </View>
        <View className="flex-1">
          <Button
            label={t('craving.distraction.whatWorked')}
            variant="secondary"
            onPress={() => setWorkedOpen(true)}
            disabled={worked.length === 0}
          />
        </View>
      </View>

      <Modal
        visible={workedOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setWorkedOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[78%] rounded-t-3xl bg-neutral-0 p-6 dark:bg-neutral-900">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-ink dark:text-neutral-50">
                {t('craving.distraction.whatWorked')}
              </Text>
              <Pressable
                onPress={() => setWorkedOpen(false)}
                accessibilityRole="button"
                hitSlop={8}
                className="px-2 py-1"
              >
                <Text className="text-sm font-semibold text-primary-600">
                  {t('common.close')}
                </Text>
              </Pressable>
            </View>

            <ScrollView className="mt-3" contentContainerClassName="gap-2">
              {worked.map((id, i) => {
                const isSel = selected === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => onSelect(id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSel }}
                    className={`flex-row items-center justify-between rounded-xl border px-4 py-3 ${
                      isSel
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-neutral-200 bg-neutral-0 dark:border-neutral-800 dark:bg-neutral-900'
                    }`}
                  >
                    <Text
                      className={`flex-1 pr-2 text-base ${isSel ? 'font-semibold text-primary-700 dark:text-primary-100' : 'text-ink dark:text-neutral-50'}`}
                    >
                      {i === 0 ? '⭐ ' : ''}
                      {isSel ? '✓ ' : ''}
                      {t(`craving.distraction.items.${id}`)}
                    </Text>
                    <Text className="text-xs text-ink-mute dark:text-neutral-400">
                      ×{helped[id]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View className="mt-4">
              <Button
                label={t('craving.resisted')}
                onPress={() => {
                  setWorkedOpen(false);
                  onResisted();
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
