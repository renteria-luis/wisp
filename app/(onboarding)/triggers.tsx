import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { OnboardingStep } from '@/components/ui/OnboardingStep';
import { OptionChip } from '@/components/ui/OptionChip';
import { useOnboarding } from '@/store/useOnboarding';
import type { TriggerCategory } from '@/types/domain';

const CATEGORIES: TriggerCategory[] = [
  'work_break',
  'commute',
  'alcohol_social',
  'after_meals',
  'stress',
  'boredom',
  'coffee',
];

export default function Triggers() {
  const router = useRouter();
  const { t } = useTranslation();
  const { triggers, patch } = useOnboarding();

  const toggle = (c: TriggerCategory) =>
    patch({
      triggers: triggers.includes(c)
        ? triggers.filter((x) => x !== c)
        : [...triggers, c],
    });

  return (
    <OnboardingStep
      stepIndex={2}
      totalSteps={5}
      title={t('onboarding.triggers.title')}
      subtitle={t('onboarding.triggers.subtitle')}
      onNext={() => router.push('/readiness')}
    >
      <View className="flex-row flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <OptionChip
            key={c}
            label={t(`triggers.${c}`)}
            selected={triggers.includes(c)}
            onPress={() => toggle(c)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}
