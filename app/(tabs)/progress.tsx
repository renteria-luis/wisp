import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sparkline } from '@/components/charts/Sparkline';
import { TrendChart } from '@/components/charts/TrendChart';
import { HealthTimeline } from '@/components/health/HealthTimeline';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  ACCELERATE_FACTOR,
  EASE_FACTOR,
  rebuildReductionPlan,
} from '@/engine/planEngine';
import { useProgressData } from '@/hooks/useProgressData';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { personal } from '@/personal/personal.config';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
import { useWishlist } from '@/store/useWishlist';
import { addDaysISO, formatMedium, todayISO } from '@/utils/date';

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-3xl font-bold text-ink dark:text-neutral-50">{value}</Text>
      <Text className="mt-1 text-center text-xs text-ink-mute dark:text-neutral-400">{label}</Text>
    </View>
  );
}

export default function Progress() {
  const { t } = useTranslation();
  const data = useProgressData();
  const plan = usePlan((s) => s.plan);
  const setPlan = usePlan((s) => s.setPlan);
  const router = useRouter();
  const currency = useSettings((s) => s.pricing.currency);
  const seenEggs = useSettings((s) => s.seenEggs);
  const markEggSeen = useSettings((s) => s.markEggSeen);
  const { nextGoal } = useSavingsGoals(data.saved);
  const purchased = useWishlist((s) => s.purchased);
  const [confirmReplan, setConfirmReplan] = useState(false);

  if (!data.hasPlan || !plan) {
    return (
      <PlaceholderScreen
        title={t('tabs.progress')}
        message={t('plan.noPlan')}
      />
    );
  }

  const isReduction = plan.track === 'gradual_reduction';
  const replan = data.recommendation;
  // Easter egg: a one-time note once savings cross a meaningful amount (§11).
  const savingsEgg =
    data.saved >= (personal.specialNumber ?? 100) &&
    !seenEggs.includes('savings');
  const applyReplan = () => {
    if (replan.action === 'hold') return;
    setPlan(
      rebuildReductionPlan({
        recentAverage: data.trend,
        startDate: todayISO(),
        curveType: plan.curveType,
        durationFactor:
          replan.action === 'ease' ? EASE_FACTOR : ACCELERATE_FACTOR,
      }),
    );
  };

  // Re-planning rewrites the schedule and can't be undone — confirm first (§9).
  const isEase = replan.action === 'ease';

  // Last two weeks of the trend, with dates for the x-axis ends.
  const trendActual = data.actual.slice(-14);
  const trendAllow = data.allowances.slice(-14);
  const chartStartLabel = formatMedium(
    addDaysISO(todayISO(), -Math.max(0, trendActual.length - 1)),
  );
  const chartEndLabel = formatMedium(todayISO());

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 px-6 pb-10 pt-4">
        <Text className="text-2xl font-bold text-ink dark:text-neutral-50">
          {t('tabs.progress')}
        </Text>

        <HealthTimeline
          recoveryAnchorMs={data.recoveryAnchorMs}
          recoveryBaseHours={data.recoveryBaseHours}
          smokeFreeSinceMs={data.smokeFreeSinceMs}
          overQuota={data.overQuota}
        />

        <Card>
          <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
            {t('progress.trend')}
          </Text>
          <View className="mt-1 flex-row items-baseline gap-2">
            <Text className="text-4xl font-bold text-ink dark:text-neutral-50">
              {data.trend.toFixed(1)}
            </Text>
            <Text className="text-sm text-ink-mute dark:text-neutral-400">
              {t('progress.perDayAvg')}
            </Text>
          </View>
          <View className="mt-3">
            <TrendChart
              actual={trendActual}
              allowances={trendAllow}
              max={Math.max(plan.baseline, 1)}
              startLabel={chartStartLabel}
              endLabel={chartEndLabel}
            />
          </View>
        </Card>

        <Card>
          {isReduction ? (
            <View className="flex-row">
              <Stat value={data.streak} label={t('progress.streak')} />
              <Stat value={data.winDayCount} label={t('progress.winDays')} />
            </View>
          ) : (
            <Stat
              value={data.smokeFreeDays}
              label={t('progress.smokeFreeDays')}
            />
          )}
        </Card>

        <Card>
          <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
            {t('progress.saved')}
          </Text>
          <Text className="mt-1 text-4xl font-bold text-ink dark:text-neutral-50">
            {data.saved.toFixed(2)} {currency}
          </Text>
          <Text className="mt-1 text-sm text-ink-mute dark:text-neutral-400">
            {t('progress.cigsAvoided', { count: data.avoided })}
          </Text>
          {data.savedSeries.length > 1 ? (
            <View className="mt-3">
              <Sparkline
                values={data.savedSeries}
                accessibilityLabel={t('progress.savedTrendA11y', {
                  amount: data.saved.toFixed(2),
                  currency,
                })}
              />
            </View>
          ) : null}
          {purchased.length > 0 ? (
            <View className="mt-4">
              <Text className="text-xs font-medium text-ink-soft dark:text-neutral-300">
                {t('progress.treatedTitle')}
              </Text>
              {purchased.slice(0, 3).map((p) => (
                <View
                  key={p.id}
                  className="mt-1 flex-row items-center justify-between"
                >
                  <Text
                    numberOfLines={1}
                    className="flex-1 pr-2 text-xs text-ink dark:text-neutral-50"
                  >
                    🎁 {p.name}
                  </Text>
                  <Text className="text-xs text-ink-mute dark:text-neutral-400">
                    {formatMedium(p.purchasedAt)}
                  </Text>
                </View>
              ))}
              {purchased.length > 3 ? (
                <Pressable
                  onPress={() => router.push('/wishlist')}
                  accessibilityRole="button"
                  className="mt-2 self-start"
                >
                  <Text className="text-xs font-semibold text-primary-600">
                    {t('progress.seeAll')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          <View className="mt-4">
            {nextGoal ? (
              <>
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-ink-soft dark:text-neutral-300">
                    {t('progress.nextGoal', { goal: nextGoal.name })}
                  </Text>
                  <Text className="text-xs text-ink-mute dark:text-neutral-400">
                    {Math.round(nextGoal.pct * 100)}%
                  </Text>
                </View>
                <View className="mt-1">
                  <ProgressBar progress={nextGoal.pct} />
                </View>
              </>
            ) : null}
            <Pressable
              onPress={() => router.push('/wishlist')}
              accessibilityRole="button"
              className="mt-3 self-start"
            >
              <Text className="text-sm font-semibold text-primary-600">
                {t('progress.wishlistLink')}
              </Text>
            </Pressable>
          </View>
        </Card>

        {savingsEgg ? (
          <Card className="border-accent-300 bg-accent-50 dark:border-accent-700 dark:bg-accent-900">
            <Text className="text-base leading-6 text-ink dark:text-neutral-50">
              {personal.easterEggs.savingsOrStreakNote}
            </Text>
            <Pressable
              onPress={() => markEggSeen('savings')}
              accessibilityRole="button"
              className="mt-3 self-end"
            >
              <Text className="text-sm font-semibold text-primary-600">
                {t('common.close')}
              </Text>
            </Pressable>
          </Card>
        ) : null}

        {isReduction && replan.action !== 'hold' ? (
          <Card className="border-accent-300 bg-accent-50 dark:border-accent-700 dark:bg-accent-900">
            <Text className="text-base font-semibold text-ink dark:text-neutral-50">
              {replan.action === 'ease'
                ? t('progress.easeTitle')
                : t('progress.accelTitle')}
            </Text>
            <Text className="mb-3 mt-1 text-sm leading-5 text-ink-soft dark:text-neutral-300">
              {replan.action === 'ease'
                ? t('progress.easeBody')
                : t('progress.accelBody')}
            </Text>
            <Button
              label={
                replan.action === 'ease'
                  ? t('progress.easeCta')
                  : t('progress.accelCta')
              }
              variant="secondary"
              onPress={() => setConfirmReplan(true)}
            />
          </Card>
        ) : null}
      </ScrollView>

      <ConfirmModal
        visible={confirmReplan}
        title={
          isEase
            ? t('progress.confirmEaseTitle')
            : t('progress.confirmAccelTitle')
        }
        message={
          isEase ? t('progress.confirmEaseBody') : t('progress.confirmAccelBody')
        }
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          applyReplan();
          setConfirmReplan(false);
        }}
        onCancel={() => setConfirmReplan(false)}
      />
    </SafeAreaView>
  );
}
