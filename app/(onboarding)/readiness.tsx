import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { OnboardingStep } from '@/components/ui/OnboardingStep';
import { OptionChip } from '@/components/ui/OptionChip';
import { Scale } from '@/components/ui/Scale';
import { useOnboarding } from '@/store/useOnboarding';
import type { TrackPreference } from '@/types/domain';

const FIRST_CIG = [
  { key: 'lt5', minutes: 5 },
  { key: 'm5_30', minutes: 30 },
  { key: 'm31_60', minutes: 45 },
  { key: 'gt60', minutes: 90 },
] as const;

const PREFERENCES: TrackPreference[] = ['quit', 'reduce', 'unsure'];

export default function Readiness() {
  const router = useRouter();
  const { t } = useTranslation();
  const { readiness, minutesToFirstCigarette, preference, patch } =
    useOnboarding();

  return (
    <OnboardingStep
      stepIndex={3}
      totalSteps={5}
      title={t('onboarding.readiness.title')}
      subtitle={t('onboarding.readiness.subtitle')}
      onNext={() => router.push('/plan-preview')}
    >
      <View>
        <Text className="mb-3 text-sm font-medium text-ink-soft">
          {t('onboarding.readiness.confidence')}
        </Text>
        <Scale value={readiness} onChange={(v) => patch({ readiness: v })} />
        <View className="mt-2 flex-row justify-between">
          <Text className="text-xs text-ink-mute">
            {t('onboarding.readiness.confidenceLow')}
          </Text>
          <Text className="text-xs text-ink-mute">
            {t('onboarding.readiness.confidenceHigh')}
          </Text>
        </View>
      </View>

      <View>
        <Text className="mb-2 text-sm font-medium text-ink-soft">
          {t('onboarding.readiness.firstCig')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {FIRST_CIG.map((o) => (
            <OptionChip
              key={o.key}
              label={t(`firstCig.${o.key}`)}
              selected={minutesToFirstCigarette === o.minutes}
              onPress={() => patch({ minutesToFirstCigarette: o.minutes })}
            />
          ))}
        </View>
      </View>

      <View>
        <Text className="mb-2 text-sm font-medium text-ink-soft">
          {t('onboarding.readiness.preference')}
        </Text>
        <View className="gap-2">
          {PREFERENCES.map((p) => (
            <OptionChip
              key={p}
              label={t(`preference.${p}`)}
              selected={preference === p}
              onPress={() => patch({ preference: p })}
            />
          ))}
        </View>
      </View>
    </OnboardingStep>
  );
}
