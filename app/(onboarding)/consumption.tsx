import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { NumberField } from '@/components/ui/NumberField';
import { OnboardingStep } from '@/components/ui/OnboardingStep';
import { OptionChip } from '@/components/ui/OptionChip';
import { useOnboarding } from '@/store/useOnboarding';
import { DEFAULT_CIGS_PER_PACK } from '@/types/domain';

const CURRENCIES = ['CAD', 'PEN', 'USD'];

export default function Consumption() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cigarettesPerDay, packPrice, cigsPerPack, currency, patch } =
    useOnboarding();

  // The pack price is NOT optional: it is the only thing that turns "cigarettes
  // not smoked" into money. Leaving it empty made `moneySaved` a permanent zero
  // — savings and the whole wishlist economy silently dead, with nothing on
  // screen to explain why.
  const valid =
    (cigarettesPerDay ?? 0) > 0 && (packPrice ?? 0) > 0 && cigsPerPack > 0;

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
        onChange={(v) => patch({ cigsPerPack: v ?? DEFAULT_CIGS_PER_PACK })}
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
