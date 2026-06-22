import { Redirect, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
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
import { useCompanion } from '@/store/useCompanion';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
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
  const balance = useEconomy((s) => s.balance);
  const pending = useEconomy((s) => s.pending);
  const setBalance = useEconomy((s) => s.setBalance);
  const setPending = useEconomy((s) => s.setPending);
  const resetEconomy = useEconomy((s) => s.reset);
  const plan = usePlan((s) => s.plan);
  const setPlan = usePlan((s) => s.setPlan);
  const clearPlan = usePlan((s) => s.clearPlan);
  const refreshToday = useLogs((s) => s.refreshToday);
  const todayCigs = useLogs((s) => s.todayCigarettes);
  const resetCompanion = useCompanion((s) => s.reset);
  const setOnboardingCompleted = useSettings((s) => s.setOnboardingCompleted);
  const resetSettings = useSettings((s) => s.reset);

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

  const wipeAll = async () => {
    await clearLogs();
    resetEconomy();
    resetCompanion();
    clearPlan();
    resetSettings();
    setOnboardingCompleted(false);
    router.replace('/welcome');
  };

  const dayIndex = plan
    ? Math.max(0, daysBetween(plan.startDate, todayISO()))
    : 0;

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-row items-center justify-between px-4 pt-2">
        <Text className="text-lg font-bold text-ink">God Mode 🔧</Text>
        <Pressable onPress={() => router.back()} className="px-2 py-1">
          <Text className="text-base font-medium text-primary-600">Close</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-6 pb-10 pt-3">
        <Text className="text-xs text-ink-mute">
          Dev only — edits live state. Derived stats (savings, trend) follow the
          logs you set here.
        </Text>

        <Card>
          <Text className="mb-1 text-sm font-semibold text-ink">Coins</Text>
          <Text className="mb-2 text-xs text-ink-mute">
            Wallet {balance} · Pending {pending}
          </Text>
          <NumberField
            label="Set wallet"
            value={coinInput}
            onChange={setCoinInput}
          />
          <View className="mt-2 gap-2">
            <Row>
              <View className="flex-1">
                <Button
                  label="Set"
                  variant="secondary"
                  onPress={() => setBalance(coinInput ?? 0)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="+1000"
                  variant="secondary"
                  onPress={() => setBalance(balance + 1000)}
                />
              </View>
            </Row>
            <Button
              label="+500 pending"
              variant="ghost"
              onPress={() => setPending(pending + 500)}
            />
            <Button
              label="Move pending → wallet"
              variant="ghost"
              onPress={() => {
                setBalance(balance + pending);
                setPending(0);
              }}
            />
          </View>
        </Card>

        <Card>
          <Text className="mb-1 text-sm font-semibold text-ink">Plan day</Text>
          <Text className="mb-2 text-xs text-ink-mute">
            {plan ? `Day ${dayIndex + 1} of ${plan.nDays}` : 'No plan'}
          </Text>
          <Row>
            <View className="flex-1">
              <Button
                label="Day −1"
                variant="secondary"
                onPress={() => shiftDays(-1)}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Day +1"
                variant="secondary"
                onPress={() => shiftDays(1)}
              />
            </View>
          </Row>
        </Card>

        <Card>
          <Text className="mb-1 text-sm font-semibold text-ink">
            Cigarette logs
          </Text>
          <Text className="mb-2 text-xs text-ink-mute">Today: {todayCigs}</Text>
          <View className="gap-2">
            <Row>
              <View className="flex-1">
                <Button
                  label="+1 today"
                  variant="secondary"
                  onPress={() => addCig(0)}
                />
              </View>
              <View className="flex-1">
                <Button
                  label="+1 yesterday"
                  variant="secondary"
                  onPress={() => addCig(1)}
                />
              </View>
            </Row>
            <Button
              label="Clear all logs"
              variant="ghost"
              onPress={clearLogs}
            />
          </View>
        </Card>

        <Card>
          <Text className="mb-2 text-sm font-semibold text-ink">Reset</Text>
          <View className="gap-2">
            <Button
              label="Re-run onboarding"
              variant="secondary"
              onPress={() => {
                setOnboardingCompleted(false);
                router.replace('/welcome');
              }}
            />
            <Button
              label="Wipe everything"
              variant="secondary"
              onPress={wipeAll}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
