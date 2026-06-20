import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { useStoreHydrated } from '@/hooks/useStoreHydrated';
import { useSettings } from '@/store/useSettings';

/**
 * Entry gate: first-time users go through onboarding; returning users land on
 * the tabs. We wait for the settings store to rehydrate from storage so we
 * don't flash the wrong route.
 */
export default function Index() {
  const hydrated = useStoreHydrated(useSettings);
  const onboardingCompleted = useSettings((s) => s.onboardingCompleted);

  if (!hydrated) {
    return <View className="flex-1 bg-cream" />;
  }

  return <Redirect href={onboardingCompleted ? '/home' : '/welcome'} />;
}
