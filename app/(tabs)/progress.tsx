import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AllowanceBars } from '@/components/ui/AllowanceBars';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';
import {
  ACCELERATE_FACTOR,
  EASE_FACTOR,
  rebuildReductionPlan,
} from '@/engine/planEngine';
import { useProgressData } from '@/hooks/useProgressData';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
import { todayISO } from '@/utils/date';

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-3xl font-bold text-ink">{value}</Text>
      <Text className="mt-1 text-center text-xs text-ink-mute">{label}</Text>
    </View>
  );
}

export default function Progress() {
  const { t } = useTranslation();
  const data = useProgressData();
  const plan = usePlan((s) => s.plan);
  const setPlan = usePlan((s) => s.setPlan);
  const currency = useSettings((s) => s.pricing.currency);

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

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 px-6 pb-10 pt-4">
        <Text className="text-2xl font-bold text-ink">
          {t('tabs.progress')}
        </Text>

        <Card>
          <Text className="text-sm font-medium text-ink-soft">
            {t('progress.trend')}
          </Text>
          <View className="mt-1 flex-row items-baseline gap-2">
            <Text className="text-4xl font-bold text-ink">
              {data.trend.toFixed(1)}
            </Text>
            <Text className="text-sm text-ink-mute">
              {t('progress.perDayAvg')}
            </Text>
          </View>
          <View className="mt-4">
            <AllowanceBars
              allowances={data.actual.slice(-14)}
              max={Math.max(plan.baseline, 1)}
              days={14}
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
          <Text className="text-sm font-medium text-ink-soft">
            {t('progress.saved')}
          </Text>
          <Text className="mt-1 text-4xl font-bold text-ink">
            {data.saved.toFixed(2)} {currency}
          </Text>
          <Text className="mt-1 text-sm text-ink-mute">
            {t('progress.cigsAvoided', { count: data.avoided })}
          </Text>
        </Card>

        {isReduction && replan.action !== 'hold' ? (
          <Card className="border-accent-300 bg-accent-50">
            <Text className="text-base font-semibold text-ink">
              {replan.action === 'ease'
                ? t('progress.easeTitle')
                : t('progress.accelTitle')}
            </Text>
            <Text className="mb-3 mt-1 text-sm leading-5 text-ink-soft">
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
              onPress={applyReplan}
            />
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
