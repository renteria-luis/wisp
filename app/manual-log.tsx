import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  addCigarette,
  countCigarettesOnDate,
} from '@/data/repositories/cigaretteLog';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useRecovery } from '@/store/useRecovery';
import { useVitalityStore } from '@/store/useVitalityStore';
import { nowISO } from '@/utils/date';

function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Backfill cigarettes on a past day — add only, any date since account start. */
export default function ManualLog() {
  const router = useRouter();
  const { t } = useTranslation();
  const anchorMs = useRecovery((s) => s.anchorMs);
  const plan = usePlan((s) => s.plan);
  const refreshToday = useLogs((s) => s.refreshToday);

  // Earliest selectable day = when the plan (account) started. NOT the recovery
  // anchor: `penalize` moves that to "now" on every logged cigarette, so it
  // would wrongly clamp the picker to the last time you smoked.
  const created = plan
    ? new Date(`${plan.startDate}T00:00:00`)
    : anchorMs
      ? new Date(anchorMs)
      : new Date(Date.now() - 30 * 86_400_000);

  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [existing, setExisting] = useState(0);
  const [count, setCount] = useState(0);
  const [saving, setSaving] = useState(false);

  // Load how many are already logged for the picked day.
  useEffect(() => {
    let cancelled = false;
    countCigarettesOnDate(dayKey(date))
      .then((n) => {
        if (cancelled) return;
        setExisting(n);
        setCount(n);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [date]);

  const onDate = (_e: DateTimePickerEvent, d?: Date) => {
    if (!d) return;
    setDate((p) => {
      const n = new Date(d);
      n.setHours(p.getHours(), p.getMinutes(), 0, 0);
      return n;
    });
  };
  const onTime = (_e: DateTimePickerEvent, d?: Date) => {
    if (!d) return;
    setDate((p) => {
      const n = new Date(p);
      n.setHours(d.getHours(), d.getMinutes(), 0, 0);
      return n;
    });
  };

  const toAdd = count - existing;
  const onRegister = async () => {
    if (toAdd <= 0 || saving) return;
    setSaving(true);
    try {
      for (let i = 0; i < toAdd; i++) {
        await addCigarette({ timestamp: nowISO(date) });
      }
      await refreshToday().catch(() => {});
      await useVitalityStore.getState().recompute(plan);
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-6 pb-2 pt-5">
        <Text className="text-xl font-bold text-ink dark:text-neutral-50">
          {t('manualLog.title')}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8} className="px-2 py-1">
          <Text className="text-base font-medium text-primary-600">
            {t('common.close')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-5 px-6 pb-10">
        <Text className="text-sm leading-5 text-ink-soft dark:text-neutral-300">
          {t('manualLog.subtitle')}
        </Text>

        <Card>
          <Text className="mb-1 text-sm font-semibold text-ink dark:text-neutral-50">
            {t('manualLog.dateLabel')}
          </Text>
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            minimumDate={created}
            maximumDate={new Date()}
            onChange={onDate}
          />
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-sm text-ink-soft dark:text-neutral-300">
              {t('manualLog.timeLabel')}
            </Text>
            <DateTimePicker
              value={date}
              mode="time"
              display="default"
              onChange={onTime}
            />
          </View>
        </Card>

        <Card>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold text-ink dark:text-neutral-50">
                {t('manualLog.countLabel')}
              </Text>
              <Text className="mt-0.5 text-xs text-ink-mute dark:text-neutral-400">
                {t('manualLog.existing', { count: existing })}
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setCount((cc) => Math.max(existing, cc - 1))}
                accessibilityRole="button"
                accessibilityLabel="−"
                className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 active:opacity-60 dark:bg-primary-900"
              >
                <Text className="text-2xl font-bold text-primary-700 dark:text-primary-100">
                  −
                </Text>
              </Pressable>
              <Text className="w-8 text-center text-2xl font-bold text-ink dark:text-neutral-50">
                {count}
              </Text>
              <Pressable
                onPress={() => setCount((cc) => cc + 1)}
                accessibilityRole="button"
                accessibilityLabel="+"
                className="h-11 w-11 items-center justify-center rounded-2xl bg-primary-100 active:opacity-60 dark:bg-primary-900"
              >
                <Text className="text-2xl font-bold text-primary-700 dark:text-primary-100">
                  +
                </Text>
              </Pressable>
            </View>
          </View>
        </Card>

        <Button
          label={
            toAdd > 0
              ? t('manualLog.registerN', { count: toAdd })
              : t('manualLog.register')
          }
          onPress={onRegister}
          disabled={toAdd <= 0 || saving}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
