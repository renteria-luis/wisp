import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { KeyboardAvoider } from '@/components/ui/KeyboardAvoider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useOnboarding } from '@/store/useOnboarding';
import { colors } from '@/theme/tokens';

/** Onboarding entry: name + framing, then into the adaptive flow. */
export default function Welcome() {
  const router = useRouter();
  const { t } = useTranslation();
  const name = useOnboarding((s) => s.name);
  const patch = useOnboarding((s) => s.patch);

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950" edges={['top', 'bottom']}>
      <KeyboardAvoider>
      <View className="flex-row justify-end px-5 pt-1">
        <ThemeToggle />
      </View>
      <View className="flex-1 justify-center px-6">
        <View className="mb-10 items-center">
          <View className="h-28 w-28 items-center justify-center rounded-full bg-primary-100">
            <View className="h-16 w-16 rounded-full bg-primary-400" />
          </View>
        </View>

        <Text className="text-center text-3xl font-bold text-ink dark:text-neutral-50">
          {t('onboarding.welcomeTitle')}
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-ink-soft dark:text-neutral-300">
          {t('onboarding.welcomeBody')}
        </Text>

        <View className="mt-8">
          <Text className="mb-1 text-sm font-medium text-ink-soft dark:text-neutral-300">
            {t('onboarding.nameLabel')}
          </Text>
          <TextInput
            value={name}
            onChangeText={(v) => patch({ name: v })}
            placeholder={t('onboarding.namePlaceholder')}
            placeholderTextColor={colors.ink.mute}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-0 dark:bg-neutral-900 px-4 py-3 text-base text-ink dark:text-neutral-50"
            returnKeyType="next"
            autoCapitalize="words"
          />
        </View>

        <Text className="mt-6 text-center text-xs leading-5 text-ink-mute dark:text-neutral-400">
          {t('onboarding.sincere')}
        </Text>
      </View>

      <View className="px-6 pb-4">
        <Button
          label={t('onboarding.getStarted')}
          onPress={() => router.push('/consumption')}
          disabled={name.trim() === ''}
        />
      </View>
      </KeyboardAvoider>
    </SafeAreaView>
  );
}
