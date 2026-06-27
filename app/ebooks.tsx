import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Free, official / public-domain resources (US NCI, Surgeon General, WHO).
const EBOOKS: { id: string; url: string }[] = [
  {
    id: 'clearing_air',
    url: 'https://smokefree.gov/sites/default/files/pdf/clearing-the-air-accessible.pdf',
  },
  {
    id: 'clear_horizons',
    url: 'https://smokefree.gov/sites/default/files/pdf/clear-horizons-accessible.pdf',
  },
  {
    id: 'sg_consumer',
    url: 'https://www.hhs.gov/sites/default/files/2020-cessation-sgr-consumer-guide.pdf',
  },
  {
    id: 'sg_report',
    url: 'https://www.hhs.gov/sites/default/files/2020-cessation-sgr-full-report.pdf',
  },
  {
    id: 'who_benefits',
    url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
  },
];

/** A small library of free, trusted quit-smoking guides (opens externally). */
export default function Ebooks() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-6 pb-3 pt-4">
        <Text className="text-xl font-bold text-ink dark:text-neutral-50">
          {t('ebooks.title')}
        </Text>
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

      <ScrollView contentContainerClassName="gap-4 px-5 pb-12 pt-2">
        <Text className="text-sm leading-5 text-ink-soft dark:text-neutral-300">
          {t('ebooks.subtitle')}
        </Text>

        {EBOOKS.map((book) => (
          <Card key={book.id}>
            <Text className="text-base font-semibold text-ink dark:text-neutral-50">
              {t(`ebooks.items.${book.id}.title`)}
            </Text>
            <Text className="mt-0.5 text-xs text-ink-mute dark:text-neutral-400">
              {t(`ebooks.items.${book.id}.author`)}
            </Text>
            <Text className="mb-3 mt-2 text-sm leading-5 text-ink-soft dark:text-neutral-300">
              {t(`ebooks.items.${book.id}.desc`)}
            </Text>
            <Button
              label={t('ebooks.open')}
              variant="secondary"
              onPress={() => void Linking.openURL(book.url)}
            />
          </Card>
        ))}

        <Text className="text-[11px] leading-4 text-ink-mute dark:text-neutral-400">
          {t('ebooks.disclaimer')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
