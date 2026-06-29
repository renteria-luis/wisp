import { Redirect, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NumberField } from '@/components/ui/NumberField';
import {
  addCigarette,
  clearAllCigaretteLogs,
} from '@/data/repositories/cigaretteLog';
import { clearAllCravingLogs } from '@/data/repositories/cravingLog';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useRecovery } from '@/store/useRecovery';
import { useSettings } from '@/store/useSettings';
import { wipeAppData } from '@/utils/appData';
import { addDaysISO, daysBetween, todayISO } from '@/utils/date';

function Row({ children }: { children: ReactNode }) {
  return <View className="flex-row gap-2">{children}</View>;
}

/**
 * God Mode — a __DEV__-only panel to edit live state for testing/debugging.
 * Reached via 7 quick taps on the Space coin balance. Not shipped to production.
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

  if (!__DEV__) return <Redirect href="/space" />;

  const shiftDays = (delta: number) => {
    if (!plan) return;
    setPlan({
      ...plan,
      startDate: addDaysISO(plan.startDate, -delta),
      targetDate: addDaysISO(plan.targetDate, -delta),
    });
  };

  const addCig = async (daysAgo: number) => {
    const date = addDaysISO(todayISO(), -daysAgo);
    await addCigarette({ timestamp: `${date}T12:00:00.000Z` });
    await refreshToday();
  };

  const clearLogs = async () => {
    await clearAllCigaretteLogs();
    await clearAllCravingLogs();
    await refreshToday();
  };

  const resetRecovery = () => {
    useRecovery.getState().reset();
    if (plan) {
      useRecovery.getState().ensureAnchor(new Date(plan.startDate).getTime());
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

      <ScrollView contentContainerClassName="gap-4 px-6 pb-10 pt-3">
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
                onPress={() => shiftDays(-1)}
              />
            </View>
            <View className="flex-1">
              <Button
                label={t('godmode.dayPlus')}
                variant="secondary"
                onPress={() => shiftDays(1)}
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
    </SafeAreaView>
  );
}
