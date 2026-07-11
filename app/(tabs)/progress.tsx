import { useRouter } from 'expo-router';
import { Gift } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SavingsChart } from '@/components/charts/SavingsChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { CigaretteHistoryModal } from '@/components/health/CigaretteHistoryModal';
import { useTutorialTarget } from '@/components/tutorial/useTutorialTarget';
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
import { useTutorial } from '@/store/useTutorial';
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
  const pricing = useSettings((s) => s.pricing);
  const currency = pricing.currency;
  const trendRange = useSettings((s) => s.trendRange);
  const seenEggs = useSettings((s) => s.seenEggs);
  const markEggSeen = useSettings((s) => s.markEggSeen);
  const { nextGoal } = useSavingsGoals(data.saved);
  const purchased = useWishlist((s) => s.purchased);
  const [confirmReplan, setConfirmReplan] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Guided-tour targets + a scroller so the tour can bring them into view.
  const scrollRef = useRef<ScrollView>(null);
  const trendTarget = useTutorialTarget('progress-trend');
  const milestonesTarget = useTutorialTarget('progress-milestones');
  const savedTarget = useTutorialTarget('progress-saved');
  const wishBtnTarget = useTutorialTarget('progress-wishlist');
  const setScroller = useTutorial((s) => s.setScroller);
  const tourWantsHistory = useTutorial(
    (s) => s.active && s.openModal === 'history',
  );
  const scrollY = useRef(0);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    // The tour passes a target's on-screen Y; scroll so it sits comfortably
    // below the top (using the live scroll offset, so nested targets work too).
    setScroller('progress', (targetWindowY) => {
      const desired = insets.top + 120;
      scrollRef.current?.scrollTo({
        y: Math.max(0, scrollY.current + (targetWindowY - desired)),
        animated: true,
      });
    });
    return () => setScroller('progress', undefined);
  }, [setScroller, insets.top]);

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

  // The trend span follows the range chosen from the history sheet.
  const windowDays =
    trendRange === 'week' ? 7 : trendRange === 'month' ? 30 : data.actual.length;
  const trendActual = data.actual.slice(-windowDays);
  const trendAllow = data.allowances.slice(-windowDays);
  // Savings chart shares the trend's window, so both cards read the same span.
  const savedSeries = data.savedSeries.slice(-windowDays);
  const savedPeak = savedSeries.length ? Math.max(...savedSeries) : 0;
  // No pack price ⇒ every cigarette is worth 0 ⇒ savings can never be anything
  // but zero. That is a broken setup, not an honest result.
  const noPrice = pricing.packPrice <= 0 || pricing.cigsPerPack <= 0;
  const chartStartLabel = formatMedium(
    addDaysISO(todayISO(), -Math.max(0, trendActual.length - 1)),
  );
  const chartEndLabel = formatMedium(todayISO());
  const rangeLabel =
    trendRange === 'week'
      ? t('history.rangeWeek')
      : trendRange === 'month'
        ? t('history.rangeMonth')
        : t('history.rangeAll');

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950" edges={['top']}>
      <ScrollView
        ref={scrollRef}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        contentContainerClassName="gap-4 px-6 pb-10 pt-4"
      >
        <Text className="text-2xl font-bold text-ink dark:text-neutral-50">
          {t('tabs.progress')}
        </Text>

        <View ref={milestonesTarget.ref} onLayout={milestonesTarget.onLayout}>
          <HealthTimeline
            recoveryAnchorMs={data.recoveryAnchorMs}
            recoveryBaseHours={data.recoveryBaseHours}
            smokeFreeSinceMs={data.smokeFreeSinceMs}
            overQuota={data.overQuota}
          />
        </View>

        <View ref={trendTarget.ref} onLayout={trendTarget.onLayout}>
        <Pressable
          onPress={() => setHistoryOpen(true)}
          accessibilityRole="button"
        >
          <Card>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
                {t('progress.trend')} · {rangeLabel}
              </Text>
              <Text className="text-xs text-primary-600">
                {t('plan.tapForInfo')}
              </Text>
            </View>
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
        </Pressable>
        </View>

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
          <View ref={savedTarget.ref} onLayout={savedTarget.onLayout}>
            <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
              {t('progress.saved')}
            </Text>
            <Text className="mt-1 text-4xl font-bold text-ink dark:text-neutral-50">
              {/* Without a pack price we cannot know — say so, rather than
                  claiming a very confident "0.00". */}
              {noPrice ? '—' : `${data.saved.toFixed(2)} ${currency}`}
            </Text>
            <Text className="mt-1 text-sm text-ink-mute dark:text-neutral-400">
              {t('progress.cigsAvoided', { count: data.avoided })}
            </Text>
            <View className="mt-4">
              {noPrice ? (
                // A missing pack price makes every saving zero, forever. Never
                // let that fail silently — send them where they can fix it.
                <Pressable
                  onPress={() => router.push('/settings')}
                  accessibilityRole="button"
                  className="rounded-xl border border-accent-300 bg-accent-50 px-4 py-3 dark:border-accent-700 dark:bg-accent-900"
                >
                  <Text className="text-center text-xs leading-5 text-ink-soft dark:text-neutral-300">
                    {t('progress.noPackPrice')}
                  </Text>
                  <Text className="mt-1 text-center text-xs font-semibold text-primary-600">
                    {t('progress.setPackPrice')}
                  </Text>
                </Pressable>
              ) : savedSeries.length > 1 && savedPeak > 0 ? (
                <SavingsChart
                  values={savedSeries}
                  currency={currency}
                  startLabel={chartStartLabel}
                  endLabel={chartEndLabel}
                />
              ) : (
                // With nothing saved yet the curve would be a flat line hidden
                // on the axis — say so instead of drawing an empty chart.
                <Text className="py-6 text-center text-xs text-ink-mute dark:text-neutral-400">
                  {t('progress.noSavingsYet')}
                </Text>
              )}
            </View>
          </View>
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
            <View className="mt-4 flex-row">
              <View ref={wishBtnTarget.ref}>
                <Button
                  label={t('progress.wishlistLink')}
                  size="sm"
                  icon={<Gift size={16} color="#ffffff" weight="duotone" />}
                  onPress={() => router.push('/wishlist')}
                />
              </View>
            </View>
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

      <CigaretteHistoryModal
        visible={historyOpen || tourWantsHistory}
        onClose={() => {
          if (tourWantsHistory) useTutorial.getState().next();
          else setHistoryOpen(false);
        }}
      />
    </SafeAreaView>
  );
}
