import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  title: string;
  message: string;
  /** Optional small footnote (e.g. the "not medical advice" note). */
  footnote?: string;
};

/** Shared shell for modal routes: a close affordance + centered content. */
export function ModalScreen({ title, message, footnote }: Props) {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-row justify-end px-4 pt-2">
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
        <Text className="mb-2 text-2xl font-semibold text-ink">{title}</Text>
        <Text className="text-center text-base leading-6 text-ink-soft">
          {message}
        </Text>
        {footnote ? (
          <Text className="mt-6 text-center text-xs text-ink-mute">
            {footnote}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
