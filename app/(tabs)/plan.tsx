import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AllowanceBars } from '@/components/ui/AllowanceBars';
import { Card } from '@/components/ui/Card';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import { allowanceForDay } from '@/engine/planEngine';
import { usePlan } from '@/store/usePlan';
import { daysBetween, formatMedium, todayISO } from '@/utils/date';

export default function Plan() {
  const { t } = useTranslation();
  const plan = usePlan((s) => s.plan);

  if (!plan) {
    return (
      <PlaceholderScreen title={t('tabs.plan')} message={t('plan.noPlan')} />
    );
  }

  const dayIndex = Math.max(0, daysBetween(plan.startDate, todayISO()));
  const upcoming = plan.allowances.slice(dayIndex, dayIndex + 7);

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

        {plan.track === 'gradual_reduction' ? (
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
                  {t('plan.dayOf', {
                    day: Math.min(dayIndex + 1, plan.nDays),
                    total: plan.nDays,
                  })}
                </Text>
              </View>
            </Card>

            <Card>
              <Text className="mb-3 text-sm font-medium text-ink-soft dark:text-neutral-300">
                {t('plan.weekAhead')}
              </Text>
              <AllowanceBars allowances={upcoming} max={plan.baseline} />
            </Card>

            <Card>
              <View className="flex-row justify-between">
                <Text className="text-sm text-ink-soft dark:text-neutral-300">
                  {t('plan.targetDate')}
                </Text>
                <Text className="text-sm font-semibold text-ink dark:text-neutral-50">
                  {formatMedium(plan.targetDate)}
                </Text>
              </View>
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
      </ScrollView>
    </SafeAreaView>
  );
}
