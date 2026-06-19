import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Onboarding entry. The full adaptive flow (consumption → profile → triggers →
 * readiness → plan preview) is built in Phase 2; this welcome step exists now so
 * the route group is in place.
 */
export default function Welcome() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-3xl font-bold text-ink">
          {t('onboarding.welcomeTitle')}
        </Text>
        <Text className="mt-4 text-center text-base leading-6 text-ink-soft">
          {t('onboarding.welcomeBody')}
        </Text>
      </View>

      <View className="px-8 pb-10">
        <Pressable
          onPress={() => router.replace('/home')}
          accessibilityRole="button"
          className="items-center rounded-xl bg-primary-500 py-4 active:opacity-90"
        >
          <Text className="text-base font-semibold text-ink-invert">
            {t('onboarding.getStarted')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
