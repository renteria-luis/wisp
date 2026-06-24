import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { OptionChip } from '@/components/ui/OptionChip';
import { Scale } from '@/components/ui/Scale';
import { BONUS_RESISTED_CRAVING } from '@/engine/economy';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';
import type { TriggerCategory } from '@/types/domain';

const CATEGORIES: TriggerCategory[] = [
  'work_break',
  'commute',
  'alcohol_social',
  'after_meals',
  'stress',
  'boredom',
  'coffee',
];

type Mode = 'smoked' | 'resisted';

export default function Log() {
  const router = useRouter();
  const { t } = useTranslation();
  const logCigarette = useLogs((s) => s.logCigarette);
  const logResisted = useLogs((s) => s.logResistedCraving);

  const [mode, setMode] = useState<Mode>('smoked');
  const [trigger, setTrigger] = useState<TriggerCategory | null>(null);
  const [intensity, setIntensity] = useState(5);
  // Manner + source default to the full-impact case: own cigarette, whole.
  const [shared, setShared] = useState(false);
  const [gifted, setGifted] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (mode === 'smoked') {
        await logCigarette({ trigger: trigger ?? undefined, shared, gifted });
      } else {
        await logResisted({ trigger: trigger ?? undefined, intensity });
        await useEconomy
          .getState()
          .award(BONUS_RESISTED_CRAVING, 'resisted_craving');
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
      <View className="flex-row justify-end px-4 pt-2">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={8}
          className="px-2 py-1"
        >
          <Text className="text-base font-medium text-primary-600">
            {t('common.close')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-6 px-6 pb-6 pt-2">
        <Text className="text-2xl font-bold text-ink dark:text-neutral-50">{t('log.title')}</Text>

        <View className="flex-row gap-2">
          <OptionChip
            label={t('log.smoked')}
            selected={mode === 'smoked'}
            onPress={() => setMode('smoked')}
          />
          <OptionChip
            label={t('log.resisted')}
            selected={mode === 'resisted'}
            onPress={() => setMode('resisted')}
          />
        </View>

        <View>
          <Text className="mb-2 text-sm font-medium text-ink-soft dark:text-neutral-300">
            {t('log.triggerLabel')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <OptionChip
                key={c}
                label={t(`triggers.${c}`)}
                selected={trigger === c}
                onPress={() => setTrigger(trigger === c ? null : c)}
              />
            ))}
          </View>
        </View>

        {mode === 'smoked' ? (
          <>
            <View>
              <Text className="mb-2 text-sm font-medium text-ink-soft dark:text-neutral-300">
                {t('log.mannerLabel')}
              </Text>
              <View className="flex-row gap-2">
                <OptionChip
                  label={t('log.whole')}
                  selected={!shared}
                  onPress={() => setShared(false)}
                />
                <OptionChip
                  label={t('log.shared')}
                  selected={shared}
                  onPress={() => setShared(true)}
                />
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-ink-soft dark:text-neutral-300">
                {t('log.sourceLabel')}
              </Text>
              <View className="flex-row gap-2">
                <OptionChip
                  label={t('log.mine')}
                  selected={!gifted}
                  onPress={() => setGifted(false)}
                />
                <OptionChip
                  label={t('log.gifted')}
                  selected={gifted}
                  onPress={() => setGifted(true)}
                />
              </View>
            </View>
          </>
        ) : null}

        {mode === 'resisted' ? (
          <View>
            <Text className="mb-3 text-sm font-medium text-ink-soft dark:text-neutral-300">
              {t('log.intensityLabel')}
            </Text>
            <Scale value={intensity} onChange={setIntensity} />
          </View>
        ) : null}
      </ScrollView>

      <View className="px-6 pb-4">
        <Button label={t('log.save')} onPress={onSave} disabled={saving} />
      </View>
    </SafeAreaView>
  );
}
