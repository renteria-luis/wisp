import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { NumberField } from '@/components/ui/NumberField';
import { OptionChip } from '@/components/ui/OptionChip';
import { Scale } from '@/components/ui/Scale';
import { BONUS_RESISTED_CRAVING } from '@/engine/economy';
import { cigarettePenaltyHours } from '@/engine/health';
import { allowanceForDay } from '@/engine/planEngine';
import { useCelebration } from '@/store/useCelebration';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useRecovery } from '@/store/useRecovery';
import { colors } from '@/theme/tokens';
import type { TriggerCategory } from '@/types/domain';
import { daysBetween, nowISO, todayISO } from '@/utils/date';

const CATEGORIES: TriggerCategory[] = [
  'work_break',
  'commute',
  'alcohol_social',
  'after_meals',
  'stress',
  'boredom',
  'coffee',
  'anger',
  'sadness',
  'waiting',
  'reward',
];

const AGO_OPTIONS = [0, 5, 10, 20, 60];

type Mode = 'smoked' | 'resisted';

export default function Log() {
  const router = useRouter();
  const { t } = useTranslation();
  const logCigarette = useLogs((s) => s.logCigarette);
  const logResisted = useLogs((s) => s.logResistedCraving);
  const plan = usePlan((s) => s.plan);
  const todayCigarettes = useLogs((s) => s.todayCigarettes);
  const celebrate = useCelebration((s) => s.celebrate);

  const [mode, setMode] = useState<Mode>('smoked');
  const [trigger, setTrigger] = useState<TriggerCategory | null>(null);
  const [intensity, setIntensity] = useState(5);
  // Manner + source default to the full-impact case: own cigarette, whole.
  const [shared, setShared] = useState(false);
  const [gifted, setGifted] = useState(false);
  // How long ago it was smoked (minutes); 0 = now (the default).
  const [minutesAgo, setMinutesAgo] = useState(0);
  const [note, setNote] = useState('');
  const [quotaMsg, setQuotaMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // A warm, non-judgmental nudge as the day's allowance gets close / passes.
  const quotaReminder = (): string | null => {
    if (!plan) return null;
    const allowance = allowanceForDay(
      plan,
      Math.max(0, daysBetween(plan.startDate, todayISO())),
    );
    const remaining = allowance - (todayCigarettes + 1);
    if (remaining === 2) return t('log.near2', { allowance });
    if (remaining === 1) return t('log.near1', { allowance });
    if (remaining === 0) return t('log.atQuota', { allowance });
    if (remaining < 0) return t('log.overQuota');
    return null;
  };

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (mode === 'smoked') {
        await logCigarette({
          trigger: trigger ?? undefined,
          shared,
          gifted,
          note: note.trim() || undefined,
          timestamp:
            minutesAgo > 0
              ? nowISO(new Date(Date.now() - minutesAgo * 60_000))
              : undefined,
        });
        // Knock recovery back once (penalty scales with the day's quota).
        if (plan) {
          const allowance = allowanceForDay(
            plan,
            Math.max(0, daysBetween(plan.startDate, todayISO())),
          );
          useRecovery
            .getState()
            .penalize(cigarettePenaltyHours(todayCigarettes, allowance));
        }
        const msg = quotaReminder();
        if (msg) {
          setQuotaMsg(msg);
          setSaving(false);
          return;
        }
      } else {
        await logResisted({ trigger: trigger ?? undefined, intensity });
        await useEconomy
          .getState()
          .award(BONUS_RESISTED_CRAVING, 'resisted_craving');
        celebrate('💪', t('celebrate.resisted'));
      }
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
      <View className="flex-row justify-end px-6 pt-5">
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

      <ScrollView
        contentContainerClassName="gap-6 px-6 pb-6 pt-2"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
      >
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

            <View>
              <Text className="mb-2 text-sm font-medium text-ink-soft dark:text-neutral-300">
                {t('log.whenLabel')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {AGO_OPTIONS.map((m) => (
                  <OptionChip
                    key={m}
                    label={
                      m === 0
                        ? t('log.now')
                        : m === 60
                          ? t('log.hourAgo')
                          : t('log.minAgo', { count: m })
                    }
                    selected={minutesAgo === m}
                    onPress={() => setMinutesAgo(m)}
                  />
                ))}
              </View>
              <View className="mt-3">
                <NumberField
                  label={t('log.customAgo')}
                  value={minutesAgo || null}
                  onChange={(v) => setMinutesAgo(v ?? 0)}
                  suffix={t('log.minutes')}
                  showDone
                />
              </View>
            </View>

            <View>
              <Text className="mb-2 text-sm font-medium text-ink-soft dark:text-neutral-300">
                {t('log.noteLabel')}
              </Text>
              <View className="flex-row items-center gap-2">
                <View className="flex-1 rounded-xl border border-neutral-200 bg-neutral-0 px-4 dark:border-neutral-800 dark:bg-neutral-900">
                  <TextInput
                    value={note}
                    onChangeText={setNote}
                    placeholder={t('log.notePlaceholder')}
                    placeholderTextColor={colors.ink.mute}
                    className="py-3 text-base text-ink dark:text-neutral-50"
                  />
                </View>
                <Button label="OK" size="sm" onPress={() => Keyboard.dismiss()} />
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

      <View className="px-6 pb-6">
        <Button label={t('log.save')} onPress={onSave} disabled={saving} />
      </View>

      {quotaMsg ? (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => {
            setQuotaMsg(null);
            router.back();
          }}
        >
          <View className="flex-1 items-center justify-center bg-black/40 px-6">
            <View className="w-full rounded-2xl bg-neutral-0 p-6 dark:bg-neutral-900">
              <Text className="text-base leading-6 text-ink dark:text-neutral-50">
                {quotaMsg}
              </Text>
              <View className="mt-4">
                <Button
                  label={t('common.ok')}
                  onPress={() => {
                    setQuotaMsg(null);
                    router.back();
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}
