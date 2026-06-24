import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { NumberField } from '@/components/ui/NumberField';
import { OnboardingStep } from '@/components/ui/OnboardingStep';
import { OptionChip } from '@/components/ui/OptionChip';
import { useOnboarding } from '@/store/useOnboarding';
import type { Gender } from '@/types/domain';

const GENDERS: Gender[] = ['female', 'male', 'nonbinary', 'prefer_not'];

export default function Profile() {
  const router = useRouter();
  const { t } = useTranslation();
  const { gender, age, yearsSmoking, patch } = useOnboarding();

  return (
    <OnboardingStep
      stepIndex={1}
      totalSteps={5}
      title={t('onboarding.profile.title')}
      subtitle={t('onboarding.profile.subtitle')}
      onNext={() => router.push('/triggers')}
    >
      <View>
        <Text className="mb-2 text-sm font-medium text-ink-soft dark:text-neutral-300">
          {t('onboarding.profile.gender')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {GENDERS.map((g) => (
            <OptionChip
              key={g}
              label={t(`gender.${g}`)}
              selected={gender === g}
              onPress={() => patch({ gender: g })}
            />
          ))}
        </View>
      </View>
      <NumberField
        label={t('onboarding.profile.age')}
        value={age}
        onChange={(v) => patch({ age: v })}
        placeholder="—"
      />
      <NumberField
        label={t('onboarding.profile.yearsSmoking')}
        value={yearsSmoking}
        onChange={(v) => patch({ yearsSmoking: v })}
        placeholder="—"
        suffix={t('onboarding.profile.years')}
      />
    </OnboardingStep>
  );
}
