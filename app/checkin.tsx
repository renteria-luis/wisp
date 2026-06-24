import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { getCheckIn, upsertCheckIn } from '@/data/repositories/checkIn';
import { BONUS_CHECK_IN } from '@/engine/economy';
import { useEconomy } from '@/store/useEconomy';
import { todayISO } from '@/utils/date';

const MOODS = [
  { value: 1, emoji: '😔' },
  { value: 2, emoji: '😕' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' },
] as const;

/** Daily mood check-in ritual — warm, quick, and worth a coin bonus once a day. */
export default function CheckIn() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mood, setMood] = useState<number | null>(null);
  const [already, setAlready] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCheckIn(todayISO())
      .then((row) => {
        if (!cancelled && row) {
          setAlready(true);
          setMood(row.mood ?? null);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const onSave = async () => {
    if (mood == null || saving) return;
    setSaving(true);
    try {
      const firstToday = !already;
      await upsertCheckIn({ date: todayISO(), mood });
      if (firstToday) {
        await useEconomy.getState().award(BONUS_CHECK_IN, 'check_in');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        void Haptics.selectionAsync();
      }
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream">
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

      <View className="flex-1 px-6 pt-4">
        <Text className="text-2xl font-bold text-ink">{t('checkin.title')}</Text>
        <Text className="mt-2 text-base leading-6 text-ink-soft">
          {t('checkin.subtitle')}
        </Text>

        <View className="mt-10 flex-row justify-between">
          {MOODS.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => setMood(m.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: mood === m.value }}
              className={`h-16 w-16 items-center justify-center rounded-2xl border ${
                mood === m.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-neutral-0'
              }`}
            >
              <Text className="text-3xl">{m.emoji}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="mt-8 text-center text-sm text-ink-mute">
          {already
            ? t('checkin.alreadyToday')
            : t('checkin.reward', { count: BONUS_CHECK_IN })}
        </Text>
      </View>

      <View className="px-6 pb-4">
        <Button
          label={t('checkin.save')}
          onPress={onSave}
          disabled={mood == null || saving}
        />
      </View>
    </SafeAreaView>
  );
}
