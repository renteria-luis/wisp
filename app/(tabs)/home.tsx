import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { allowanceForDay } from '@/engine/planEngine';
import { personal } from '@/personal/personal.config';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
import { daysBetween, todayISO } from '@/utils/date';

/**
 * Home. The real companion (layered SVG, vitality-driven) arrives in Phase 4;
 * for now it greets the user by name and reflects today's logged status.
 */
export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const userName = useSettings((s) => s.userName);
  const companionName = useSettings((s) => s.companionName);
  const plan = usePlan((s) => s.plan);
  const todayCigarettes = useLogs((s) => s.todayCigarettes);
  const name = userName || personal.dedicateeName;

  let status: string | null = null;
  if (plan) {
    if (plan.track === 'gradual_reduction') {
      const allowance = allowanceForDay(
        plan,
        daysBetween(plan.startDate, todayISO()),
      );
      status = t('home.todayOf', { count: todayCigarettes, allowance });
    } else {
      status =
        todayCigarettes === 0
          ? t('home.smokeFreeToday')
          : t('home.loggedToday', { count: todayCigarettes });
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="h-44 w-44 items-center justify-center rounded-full bg-primary-100">
          <View className="h-28 w-28 rounded-full bg-primary-400" />
        </View>

        <Text className="mt-10 text-3xl font-bold text-ink">
          {t('home.greeting', { name })}
        </Text>
        <Text className="mt-3 text-center text-base leading-6 text-ink-soft">
          {t('home.subtitle', { companion: companionName })}
        </Text>

        {status ? (
          <View className="mt-8 rounded-full bg-primary-100 px-5 py-2">
            <Text className="text-sm font-bold text-primary-700">{status}</Text>
          </View>
        ) : null}
      </View>

      <View className="px-6 pb-4">
        <Button
          label={t('home.logAction')}
          onPress={() => router.push('/log')}
        />
      </View>
    </SafeAreaView>
  );
}
