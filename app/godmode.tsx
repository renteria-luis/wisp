import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { NumberField } from '@/components/ui/NumberField';
import {
  addCigarette,
  clearAllCigaretteLogs,
  shiftCigaretteDates,
} from '@/data/repositories/cigaretteLog';
import {
  clearAllCravingLogs,
  shiftCravingDates,
} from '@/data/repositories/cravingLog';
import { cigarettePenaltyHours } from '@/engine/health';
import { allowanceForDay } from '@/engine/planEngine';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useRecovery } from '@/store/useRecovery';
import { useSettings } from '@/store/useSettings';
import { useVitalityStore } from '@/store/useVitalityStore';
import { wipeAppData } from '@/utils/appData';
import { addDaysISO, daysBetween, nowISO, todayISO } from '@/utils/date';

function Row({ children }: { children: ReactNode }) {
  return <View className="flex-row gap-2">{children}</View>;
}

/**
 * God Mode — a panel to edit live state for testing/debugging. Reached from
 * About via 7 quick taps on the heart, then the code 3019 (works in prod too).
 */
export default function GodMode() {
  const router = useRouter();
  const { t } = useTranslation();
  const balance = useEconomy((s) => s.balance);
  const pending = useEconomy((s) => s.pending);
  const setBalance = useEconomy((s) => s.setBalance);
  const setPending = useEconomy((s) => s.setPending);
  const plan = usePlan((s) => s.plan);
  const setPlan = usePlan((s) => s.setPlan);
  const refreshToday = useLogs((s) => s.refreshToday);
  const todayCigs = useLogs((s) => s.todayCigarettes);
  const setOnboardingCompleted = useSettings((s) => s.setOnboardingCompleted);

  const [coinInput, setCoinInput] = useState<number | null>(balance);

  // Simulate `delta` days passing: move the plan window, shift existing logs
  // (so today's count resets and history is preserved) and advance recovery so
  // the Progress tab / milestones actually move.
  const advanceDay = async (delta: number) => {
    if (!plan) return;
    setPlan({
      ...plan,
      startDate: addDaysISO(plan.startDate, -delta),
      targetDate: addDaysISO(plan.targetDate, -delta),
    });
    await shiftCigaretteDates(-delta);
    await shiftCravingDates(-delta);
    useRecovery.getState().advance(delta);
    await refreshToday();
    await useVitalityStore.getState().recompute(usePlan.getState().plan);
  };

  const addCig = async (daysAgo: number) => {
    if (daysAgo === 0) {
      // Behave like a real "smoked now" log: resets smoke-free + dents recovery.
      await addCigarette({ timestamp: nowISO() });
      if (plan) {
        const allowance = allowanceForDay(
          plan,
          Math.max(0, daysBetween(plan.startDate, todayISO())),
        );
        useRecovery
          .getState()
          .penalize(cigarettePenaltyHours(todayCigs, allowance));
      }
    } else {
      // Backfill a past day (local noon) for building history — no recovery hit.
      const date = addDaysISO(todayISO(), -daysAgo);
      await addCigarette({ timestamp: `${date}T12:00:00.000` });
    }
    await refreshToday();
    await useVitalityStore.getState().recompute(usePlan.getState().plan);
  };

  const clearLogs = async () => {
    await clearAllCigaretteLogs();
    await clearAllCravingLogs();
    await refreshToday();
  };

  const resetRecovery = () => {
    useRecovery.getState().reset();
    if (plan) {
      useRecovery.getState().ensureAnchor();
    }
  };

  const wipeAll = async () => {
    await wipeAppData();
    router.replace('/welcome');
  };

  const dayIndex = plan
    ? Math.max(0, daysBetween(plan.startDate, todayISO()))
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
      <KeyboardAvoider>
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Text className="text-lg font-bold text-ink dark:text-neutral-50">
          {t('godmode.title')}
        </Text>
        <Pressable onPress={() => router.back()} className="px-2 py-1">
          <Text className="text-base font-medium text-primary-600">
            {t('common.close')}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-6 pb-10 pt-3"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text className="text-xs text-ink-mute dark:text-neutral-400">
          {t('godmode.subtitle')}
        </Text>

        <Card>
          <Text className="mb-1 text-sm font-semibold text-ink dark:text-neutral-50">
            {t('godmode.coins')}
          </Text>
          <Text className="mb-2 text-xs text-ink-mute dark:text-neutral-400">
            {t('godmode.walletPending', { wallet: balance, pending })}
          </Text>
          <NumberField
            label={t('godmode.setWallet')}
            value={coinInput}
            onChange={setCoinInput}
          />
          <View className="mt-2 gap-2">
            <Row>
              <View className="flex-1">
                <Button
                  label={t('godmode.set')}
                  variant="secondary"
                  onPress={() => setBalance(coinInput ?? 0)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label={t('godmode.plus1000')}
                  variant="secondary"
                  onPress={() => setBalance(balance + 1000)}
                />
              </View>
            </Row>
            <Button
              label={t('godmode.plus500pending')}
              variant="ghost"
              onPress={() => setPending(pending + 500)}
            />
            <Button
              label={t('godmode.movePending')}
              variant="ghost"
              onPress={() => {
                setBalance(balance + pending);
                setPending(0);
              }}
            />
          </View>
        </Card>

        <Card>
          <Text className="mb-1 text-sm font-semibold text-ink dark:text-neutral-50">
            {t('godmode.planDay')}
          </Text>
          <Text className="mb-2 text-xs text-ink-mute dark:text-neutral-400">
            {plan
              ? t('godmode.dayOf', { day: dayIndex + 1, total: plan.nDays })
              : t('godmode.noPlan')}
          </Text>
          <Row>
            <View className="flex-1">
              <Button
                label={t('godmode.dayMinus')}
                variant="secondary"
                onPress={() => void advanceDay(-1)}
              />
            </View>
            <View className="flex-1">
              <Button
                label={t('godmode.dayPlus')}
                variant="secondary"
                onPress={() => void advanceDay(1)}
              />
            </View>
          </Row>
        </Card>

        <Card>
          <Text className="mb-1 text-sm font-semibold text-ink dark:text-neutral-50">
            {t('godmode.cigaretteLogs')}
          </Text>
          <Text className="mb-2 text-xs text-ink-mute dark:text-neutral-400">
            {t('godmode.today', { count: todayCigs })}
          </Text>
          <View className="gap-2">
            <Row>
              <View className="flex-1">
                <Button
                  label={t('godmode.plusToday')}
                  variant="secondary"
                  onPress={() => addCig(0)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label={t('godmode.plusYesterday')}
                  variant="secondary"
                  onPress={() => addCig(1)}
                />
              </View>
            </Row>
            <Button
              label={t('godmode.clearLogs')}
              variant="ghost"
              onPress={clearLogs}
            />
          </View>
        </Card>

        <Card>
          <Text className="mb-2 text-sm font-semibold text-ink dark:text-neutral-50">
            {t('godmode.reset')}
          </Text>
          <View className="gap-2">
            <Button
              label={t('godmode.resetRecovery')}
              variant="secondary"
              onPress={resetRecovery}
            />
            <Button
              label={t('godmode.rerunOnboarding')}
              variant="secondary"
              onPress={() => {
                setOnboardingCompleted(false);
                router.replace('/welcome');
              }}
            />
            <Button
              label={t('godmode.wipe')}
              variant="secondary"
              onPress={wipeAll}
            />
          </View>
        </Card>
      </ScrollView>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}
