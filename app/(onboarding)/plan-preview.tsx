import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { AllowanceBars } from '@/components/ui/AllowanceBars';
import { Card } from '@/components/ui/Card';
import { OnboardingStep } from '@/components/ui/OnboardingStep';
import { OptionChip } from '@/components/ui/OptionChip';
import { allowanceForDay, buildPlan, suggestTrack } from '@/engine/planEngine';
import {
  requestNotificationPermission,
  rescheduleTriggerNotifications,
} from '@/notifications/scheduler';
import { useOnboarding } from '@/store/useOnboarding';
import { useSettings } from '@/store/useSettings';
import { usePlan } from '@/store/usePlan';
import type { Track } from '@/types/domain';
import { addDaysISO, formatMedium, todayISO } from '@/utils/date';

const TRACKS: Track[] = ['gradual_reduction', 'cold_turkey'];

export default function PlanPreview() {
  const router = useRouter();
  const { t } = useTranslation();
  const onboarding = useOnboarding();
  const settings = useSettings();
  const setPlan = usePlan((s) => s.setPlan);

  const baseline = onboarding.cigarettesPerDay ?? 0;
  const startDate = todayISO();

  const suggestion = useMemo(
    () =>
      suggestTrack({
        cigarettesPerDay: baseline,
        readiness: onboarding.readiness,
        minutesToFirstCigarette:
          onboarding.minutesToFirstCigarette ?? undefined,
        preference: onboarding.preference,
      }),
    [
      baseline,
      onboarding.readiness,
      onboarding.minutesToFirstCigarette,
      onboarding.preference,
    ],
  );

  const chosenTrack = onboarding.trackOverride ?? suggestion.track;

  const plan = useMemo(
    () =>
      buildPlan({
        track: chosenTrack,
        baseline,
        startDate,
        curveType: onboarding.curveType,
      }),
    [chosenTrack, baseline, startDate, onboarding.curveType],
  );

  const onConfirm = async () => {
    settings.setBaseline(baseline);
    settings.setUserName(onboarding.name.trim());
    settings.setProfile({
      gender: onboarding.gender ?? undefined,
      age: onboarding.age ?? undefined,
      yearsSmoking: onboarding.yearsSmoking ?? undefined,
      startedSmokingDate:
        onboarding.yearsSmoking != null && onboarding.yearsSmoking > 0
          ? addDaysISO(startDate, -Math.round(onboarding.yearsSmoking * 365))
          : undefined,
    });
    settings.setPricing({
      packPrice: onboarding.packPrice ?? 0,
      cigsPerPack: onboarding.cigsPerPack,
      currency: onboarding.currency,
    });
    settings.setTriggers(onboarding.triggers);
    setPlan(plan);
    settings.setOnboardingCompleted(true);
    // Ask for notification permission in context, right after onboarding (§9).
    const granted = await requestNotificationPermission();
    settings.setNotificationsEnabled(granted);
    if (granted) {
      await rescheduleTriggerNotifications(
        onboarding.triggers,
        settings.quietHours,
        true,
      );
    }
    onboarding.reset();
    router.replace('/home');
  };

  return (
    <OnboardingStep
      stepIndex={4}
      totalSteps={5}
      title={t('onboarding.preview.title')}
      onNext={onConfirm}
      nextLabel={t('onboarding.preview.confirm')}
    >
      <Text className="text-base leading-6 text-ink dark:text-neutral-50">
        {t('onboarding.preview.greeting', { name: onboarding.name.trim() })}
      </Text>

      <Card>
        <Text className="text-xs font-semibold uppercase tracking-wide text-accent-600">
          {t('onboarding.preview.suggested')}
        </Text>
        <Text className="mt-1 text-xl font-bold text-ink dark:text-neutral-50">
          {t(`plan.track.${chosenTrack}`)}
        </Text>
        <Text className="mt-2 text-sm leading-5 text-ink-soft dark:text-neutral-300">
          {t(`plan.rationale.${chosenTrack}`)}
        </Text>
      </Card>

      <View>
        <Text className="mb-2 text-sm font-medium text-ink-soft dark:text-neutral-300">
          {t('onboarding.preview.chooseTrack')}
        </Text>
        <View className="flex-row gap-2">
          {TRACKS.map((track) => (
            <OptionChip
              key={track}
              label={t(`plan.track.${track}`)}
              selected={chosenTrack === track}
              onPress={() => onboarding.patch({ trackOverride: track })}
            />
          ))}
        </View>
      </View>

      <Card>
        {chosenTrack === 'gradual_reduction' ? (
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-ink-soft dark:text-neutral-300">
                {t('plan.todayTarget')}
              </Text>
              <Text className="text-sm font-semibold text-ink dark:text-neutral-50">
                {t('plan.cigarettes', { count: allowanceForDay(plan, 0) })}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-ink-soft dark:text-neutral-300">
                {t('plan.targetDate')}
              </Text>
              <Text className="text-sm font-semibold text-ink dark:text-neutral-50">
                {formatMedium(plan.targetDate)}
              </Text>
            </View>
            <View>
              <Text className="mb-4 text-sm text-ink-soft dark:text-neutral-300">
                {t('plan.weekAhead')}
              </Text>
              <AllowanceBars allowances={plan.allowances} max={baseline} />
            </View>
          </View>
        ) : (
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-ink-soft dark:text-neutral-300">
                {t('plan.quitDate')}
              </Text>
              <Text className="text-sm font-semibold text-ink dark:text-neutral-50">
                {formatMedium(plan.startDate)}
              </Text>
            </View>
            <Text className="text-sm leading-5 text-ink-soft dark:text-neutral-300">
              {t('plan.criticalWindow', { days: plan.nDays })}
            </Text>
          </View>
        )}
      </Card>
    </OnboardingStep>
  );
}
