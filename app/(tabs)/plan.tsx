import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AllowanceBars } from '@/components/ui/AllowanceBars';
import { Card } from '@/components/ui/Card';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { nextMilestone } from '@/engine/health';
import { allowanceForDay } from '@/engine/planEngine';
import { useProgressData } from '@/hooks/useProgressData';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
import { daysBetween, formatMedium, todayISO } from '@/utils/date';

export default function Plan() {
  const { t } = useTranslation();
  const router = useRouter();
  const plan = usePlan((s) => s.plan);
  const currency = useSettings((s) => s.pricing.currency);
  const data = useProgressData();

  if (!plan) {
    return (
      <PlaceholderScreen title={t('tabs.plan')} message={t('plan.noPlan')} />
    );
  }

  const isReduction = plan.track === 'gradual_reduction';
  const dayIndex = Math.max(0, daysBetween(plan.startDate, todayISO()));
  const upcoming = plan.allowances.slice(dayIndex, dayIndex + 7);
  const journeyPct = Math.min(1, (dayIndex + 1) / plan.nDays);
  const next = nextMilestone(data.smokeFreeHours);

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 px-6 pb-10 pt-4">
        <View>
          <Text className="text-sm font-medium text-ink-mute dark:text-neutral-400">
            {t('tabs.plan')}
          </Text>
          <Text className="text-2xl font-bold text-ink dark:text-neutral-50">
            {t(`plan.track.${plan.track}`)}
          </Text>
        </View>

        {/* Journey progress */}
        <Card>
          <View className="mb-2 flex-row items-baseline justify-between">
            <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
              {t('plan.journey')}
            </Text>
            <Text className="text-sm text-ink-mute dark:text-neutral-400">
              {t('plan.dayOf', {
                day: Math.min(dayIndex + 1, plan.nDays),
                total: plan.nDays,
              })}
            </Text>
          </View>
          <ProgressBar progress={journeyPct} height={10} />
        </Card>

        {isReduction ? (
          <>
            <Card>
              <View className="flex-row items-end justify-between">
                <View>
                  <Text className="text-sm text-ink-soft dark:text-neutral-300">
                    {t('plan.todayTarget')}
                  </Text>
                  <Text className="text-4xl font-bold text-ink dark:text-neutral-50">
                    {allowanceForDay(plan, dayIndex)}
                  </Text>
                </View>
                <Text className="text-sm text-ink-mute dark:text-neutral-400">
                  {t('plan.targetDate')}: {formatMedium(plan.targetDate)}
                </Text>
              </View>
            </Card>

            <Card>
              <Text className="mb-3 text-sm font-medium text-ink-soft dark:text-neutral-300">
                {t('plan.weekAhead')}
              </Text>
              <AllowanceBars allowances={upcoming} max={plan.baseline} />
            </Card>
          </>
        ) : (
          <Card>
            <Text className="text-base font-semibold text-ink dark:text-neutral-50">
              {t('plan.smokeFreeSince', { date: formatMedium(plan.startDate) })}
            </Text>
            <Text className="mt-2 text-sm leading-5 text-ink-soft dark:text-neutral-300">
              {t('plan.criticalWindow', { days: plan.nDays })}
            </Text>
          </Card>
        )}

        {/* Savings so far → wishlist */}
        <Pressable onPress={() => router.push('/wishlist')}>
          <Card>
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-ink-soft dark:text-neutral-300">
                  {t('plan.savedSoFar')}
                </Text>
                <Text className="mt-1 text-3xl font-bold text-ink dark:text-neutral-50">
                  {data.saved.toFixed(2)} {currency}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-primary-600">
                {t('progress.wishlistLink')}
              </Text>
            </View>
          </Card>
        </Pressable>

        {/* Next recovery milestone */}
        {next ? (
          <Card>
            <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
              {t('plan.nextMilestone')}
            </Text>
            <Text className="mt-1 text-base font-semibold text-ink dark:text-neutral-50">
              {t(`health.milestones.${next.milestone.id}.title`)}
            </Text>
            <Text className="mb-3 mt-0.5 text-xs leading-4 text-ink-soft dark:text-neutral-300">
              {t(`health.milestones.${next.milestone.id}.body`)}
            </Text>
            <ProgressBar progress={next.progress} />
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
