import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { personal } from '@/personal/personal.config';

const VERSION = '1.0.0';

export default function About() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-row justify-end px-5 pt-4">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          hitSlop={8}
          className="px-2 py-1"
        >
          <Text className="text-base font-medium text-primary-600">
            {t('common.close')}
          </Text>
        </Pressable>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-4xl font-bold text-primary-600">
          {personal.appName}
        </Text>
        <Text className="mt-1 text-sm text-ink-mute">
          {t('about.version', { version: VERSION })}
        </Text>

        <View className="mt-10 items-center">
          <Text className="text-2xl text-accent-500">♥</Text>
          <Text className="mt-2 text-center text-base font-medium text-ink">
            {personal.dedicationLine}
          </Text>
        </View>

        <Text className="mt-10 text-center text-sm leading-6 text-ink-soft">
          {t('about.privacy')}
        </Text>
        <Text className="mt-2 text-center text-xs text-ink-mute">
          {t('about.madeBy', { name: personal.authorName })}
        </Text>
      </View>

      <Text className="px-8 pb-6 text-center text-xs text-ink-mute">
        {t('common.notMedicalAdvice')}
      </Text>
    </SafeAreaView>
  );
}
