import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { personal } from '@/personal/personal.config';

/**
 * Placeholder Home. The real companion (layered SVG, vitality-driven) and
 * today's status arrive in later phases. For Phase 0 this proves the styling
 * (NativeWind + tokens), i18n, and personal config are all wired end to end.
 */
export default function Home() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="h-44 w-44 items-center justify-center rounded-full bg-primary-100">
          <View className="h-28 w-28 rounded-full bg-primary-400" />
        </View>

        <Text className="mt-10 text-3xl font-bold text-ink">
          {t('home.greeting', { name: personal.dedicateeName })}
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-ink-soft">
          {t('home.subtitle', { companion: personal.companionDefaultName })}
        </Text>
      </View>
    </SafeAreaView>
  );
}
