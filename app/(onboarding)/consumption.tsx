import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { NumberField } from '@/components/ui/NumberField';
import { OnboardingStep } from '@/components/ui/OnboardingStep';
import { OptionChip } from '@/components/ui/OptionChip';
import { useOnboarding } from '@/store/useOnboarding';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'MXN', 'CAD'];

export default function Consumption() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cigarettesPerDay, packPrice, cigsPerPack, currency, patch } =
    useOnboarding();

  const valid = (cigarettesPerDay ?? 0) > 0;

  return (
    <OnboardingStep
      stepIndex={0}
      totalSteps={5}
      title={t('onboarding.consumption.title')}
      subtitle={t('onboarding.consumption.subtitle')}
      nextDisabled={!valid}
      onNext={() => router.push('/profile')}
    >
      <NumberField
        label={t('onboarding.consumption.perDay')}
        value={cigarettesPerDay}
        onChange={(v) => patch({ cigarettesPerDay: v })}
        placeholder="0"
      />
      <NumberField
        label={t('onboarding.consumption.packPrice')}
        value={packPrice}
        onChange={(v) => patch({ packPrice: v })}
        decimal
        placeholder="0.00"
        suffix={currency}
      />
      <NumberField
        label={t('onboarding.consumption.cigsPerPack')}
        value={cigsPerPack}
        onChange={(v) => patch({ cigsPerPack: v ?? 20 })}
        placeholder="20"
      />
      <View>
        <Text className="mb-2 text-sm font-medium text-ink-soft dark:text-neutral-300">
          {t('onboarding.consumption.currency')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {CURRENCIES.map((c) => (
            <OptionChip
              key={c}
              label={c}
              selected={currency === c}
              onPress={() => patch({ currency: c })}
            />
          ))}
        </View>
      </View>
    </OnboardingStep>
  );
}
