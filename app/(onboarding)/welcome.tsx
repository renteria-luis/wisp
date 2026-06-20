import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { useOnboarding } from '@/store/useOnboarding';
import { colors } from '@/theme/tokens';

/** Onboarding entry: name + framing, then into the adaptive flow. */
export default function Welcome() {
  const router = useRouter();
  const { t } = useTranslation();
  const name = useOnboarding((s) => s.name);
  const patch = useOnboarding((s) => s.patch);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center px-6">
        <View className="mb-10 items-center">
          <View className="h-28 w-28 items-center justify-center rounded-full bg-primary-100">
            <View className="h-16 w-16 rounded-full bg-primary-400" />
          </View>
        </View>

        <Text className="text-center text-3xl font-bold text-ink">
          {t('onboarding.welcomeTitle')}
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-ink-soft">
          {t('onboarding.welcomeBody')}
        </Text>

        <View className="mt-8">
          <Text className="mb-1 text-sm font-medium text-ink-soft">
            {t('onboarding.nameLabel')}
          </Text>
          <TextInput
            value={name}
            onChangeText={(v) => patch({ name: v })}
            placeholder={t('onboarding.namePlaceholder')}
            placeholderTextColor={colors.ink.mute}
            className="rounded-xl border border-neutral-200 bg-neutral-0 px-4 py-3 text-base text-ink"
            returnKeyType="next"
            autoCapitalize="words"
          />
        </View>
      </View>

      <View className="px-6 pb-4">
        <Button
          label={t('onboarding.getStarted')}
          onPress={() => router.push('/consumption')}
          disabled={name.trim() === ''}
        />
      </View>
    </SafeAreaView>
  );
}
