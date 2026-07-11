import { useRouter } from 'expo-router';
import { Gift } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SecretPlanPeek } from '@/components/companion/SecretPlanPeek';
import { MilestoneDetailModal } from '@/components/health/MilestoneDetailModal';
import { useTutorialTarget } from '@/components/tutorial/useTutorialTarget';
import { AllowanceBars } from '@/components/ui/AllowanceBars';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { HEALTH_MILESTONES, nextMilestone } from '@/engine/health';
import { allowanceForDay } from '@/engine/planEngine';
import { useProgressData } from '@/hooks/useProgressData';
import { useSavingsGoals } from '@/hooks/useSavingsGoals';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
import { useTutorial } from '@/store/useTutorial';
import { daysBetween, formatMedium, todayISO } from '@/utils/date';

export default function Plan() {
  const { t } = useTranslation();
  const router = useRouter();
  const plan = usePlan((s) => s.plan);
  const currency = useSettings((s) => s.pricing.currency);
  const data = useProgressData();
  const { goals } = useSavingsGoals(data.saved);
  const todayCigarettes = useLogs((s) => s.todayCigarettes);
  const [detailId, setDetailId] = useState<string | null>(null);
  const journeyTarget = useTutorialTarget('plan-journey');
  const tourOn = useTutorial((s) => s.active);
  const setScroller = useTutorial((s) => s.setScroller);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    setScroller('plan', (targetWindowY) => {
      const desired = insets.top + 120;
      scrollRef.current?.scrollTo({
        y: Math.max(0, scrollY.current + (targetWindowY - desired)),
        animated: true,
      });
    });
    return () => setScroller('plan', undefined);
  }, [setScroller, insets.top]);

  if (!plan) {
    return (
      <PlaceholderScreen title={t('tabs.plan')} message={t('plan.noPlan')} />
    );
  }

  const isReduction = plan.track === 'gradual_reduction';
  const dayIndex = Math.max(0, daysBetween(plan.startDate, todayISO()));
  const upcoming = plan.allowances.slice(dayIndex, dayIndex + 7);
  const allowance = allowanceForDay(plan, dayIndex);
  const remaining = allowance - todayCigarettes;
  // Journey = how far through the plan by the calendar, so it matches the
  // "day X of Y" label and never retreats. Whether you're actually cutting down
  // lives on the Progress tab (trend, streak, win days) + the recovery timeline.
  const journeyPct = tourOn ? 0 : Math.min(1, (dayIndex + 1) / plan.nDays);
  const next = nextMilestone(data.recoveryHours);
  const detail = detailId
    ? HEALTH_MILESTONES.find((m) => m.id === detailId)
    : null;

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950" edges={['top']}>
      <ScrollView
        ref={scrollRef}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerClassName="gap-4 px-6 pb-0 pt-4"
      >
        <View>
          <Text className="text-sm font-medium text-ink-mute dark:text-neutral-400">
            {t('tabs.plan')}
          </Text>
          <Text className="text-2xl font-bold text-ink dark:text-neutral-50">
            {t(`plan.track.${plan.track}`)}
          </Text>
        </View>

        {/* Journey progress */}
        <View ref={journeyTarget.ref} onLayout={journeyTarget.onLayout}>
          <Card>
            <View className="mb-2 flex-row items-baseline justify-between">
              <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
                {t('plan.journey')}
              </Text>
              <Text className="text-sm text-ink-mute dark:text-neutral-400">
                {t('plan.dayOf', {
                  day: tourOn ? 1 : Math.min(dayIndex + 1, plan.nDays),
                  total: plan.nDays,
                })}
              </Text>
            </View>
            <ProgressBar progress={journeyPct} height={10} />
          </Card>
        </View>

        {isReduction ? (
          <>
            <Card>
              <View className="flex-row items-end justify-between">
                <View>
                  <Text className="text-sm text-ink-soft dark:text-neutral-300">
                    {t('plan.remainingToday')}
                  </Text>
                  <Text className="text-4xl font-bold text-ink dark:text-neutral-50">
                    {Math.max(0, remaining)}
                  </Text>
                  {remaining < 0 ? (
                    <Text className="mt-0.5 text-xs font-semibold text-accent-600 dark:text-accent-300">
                      {t('plan.overBy', { count: -remaining })}
                    </Text>
                  ) : (
                    <View className="mt-1.5 flex-row items-baseline">
                      <Text className="text-lg font-bold text-primary-600 dark:text-primary-300">
                        {todayCigarettes}
                      </Text>
                      <Text className="mx-1 text-sm text-ink-mute dark:text-neutral-500">
                        /
                      </Text>
                      <Text className="text-lg font-semibold text-ink-soft dark:text-neutral-300">
                        {allowance}
                      </Text>
                      <Text className="ml-2 text-[10px] uppercase tracking-[2px] text-ink-mute dark:text-neutral-500">
                        {t('plan.todayShort')}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-ink-mute dark:text-neutral-400">
                  {t('plan.targetDate')}: {formatMedium(plan.targetDate)}
                </Text>
              </View>
            </Card>

            <Card>
              <Text className="mb-4 text-sm font-medium text-ink-soft dark:text-neutral-300">
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

        {/* Savings so far + wishlist preview */}
        <Card>
          <Text className="text-sm text-ink-soft dark:text-neutral-300">
            {t('plan.savedSoFar')}
          </Text>
          <Text className="mt-1 text-3xl font-bold text-ink dark:text-neutral-50">
            {data.saved.toFixed(2)} {currency}
          </Text>
          {goals.slice(0, 3).map((g) => (
            <View key={g.key} className="mt-3">
              <View className="flex-row items-center justify-between">
                <Text
                  numberOfLines={1}
                  className="flex-1 pr-2 text-xs text-ink-soft dark:text-neutral-300"
                >
                  {g.name}
                </Text>
                <Text
                  className={`text-xs ${g.reached ? 'font-bold text-primary-600' : 'text-ink-mute dark:text-neutral-400'}`}
                >
                  {g.reached ? t('wishlist.reached') : `${Math.round(g.pct * 100)}%`}
                </Text>
              </View>
              <View className="mt-1">
                <ProgressBar progress={g.pct} />
              </View>
            </View>
          ))}
          <View className="mt-4 flex-row">
            <Button
              label={t('progress.wishlistLink')}
              size="sm"
              icon={<Gift size={16} color="#ffffff" weight="duotone" />}
              onPress={() => router.push('/wishlist')}
            />
          </View>
        </Card>

        {/* Next recovery milestone — tap to see the details/citation. */}
        {next ? (
          <Pressable
            onPress={() => setDetailId(next.milestone.id)}
            accessibilityRole="button"
          >
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
                  {t('plan.nextMilestone')}
                </Text>
                <Text className="text-xs text-ink-mute dark:text-neutral-400">
                  {t('plan.tapForInfo')}
                </Text>
              </View>
              <Text className="mt-1 text-base font-semibold text-ink dark:text-neutral-50">
                {t(`health.milestones.${next.milestone.id}.title`)}
              </Text>
              <Text className="mb-3 mt-0.5 text-xs leading-4 text-ink-soft dark:text-neutral-300">
                {t(`health.milestones.${next.milestone.id}.body`)}
              </Text>
              <ProgressBar progress={next.progress} />
            </Card>
          </Pressable>
        ) : null}

        <Button
          label={t('plan.ebooks')}
          variant="secondary"
          onPress={() => router.push('/ebooks')}
        />

        {/* Last item: at the bottom of the scroll its face meets the tab bar;
            scrolling up carries it away so it never covers the button. */}
        <SecretPlanPeek />
      </ScrollView>

      {detail ? (
        <MilestoneDetailModal
          milestone={detail}
          onClose={() => setDetailId(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}
