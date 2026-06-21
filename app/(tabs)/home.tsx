import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Companion } from '@/components/companion/Companion';
import { Button } from '@/components/ui/Button';
import { cosmeticById } from '@/engine/cosmetics';
import { allowanceForDay } from '@/engine/planEngine';
import { useVitality } from '@/hooks/useVitality';
import { startSituationalSupport } from '@/notifications/scheduler';
import { personal } from '@/personal/personal.config';
import { useCompanion } from '@/store/useCompanion';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
import { colors } from '@/theme/tokens';
import { daysBetween, todayISO } from '@/utils/date';

const SITUATIONAL_MS = 3 * 60 * 60 * 1000;

/** Home: the vitality-driven companion, today's status, and the panic button. */
export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const userName = useSettings((s) => s.userName);
  const companionName = useSettings((s) => s.companionName);
  const situationalUntil = useSettings((s) => s.situationalUntil);
  const setSituationalUntil = useSettings((s) => s.setSituationalUntil);
  const plan = usePlan((s) => s.plan);
  const todayCigarettes = useLogs((s) => s.todayCigarettes);
  const { score, band } = useVitality();
  const equipped = useCompanion((s) => s.equipped);
  const name = userName || personal.dedicateeName;

  const companionColor =
    cosmeticById(equipped.companion_color ?? '')?.swatch ??
    colors.primary['400'];
  const accessoryColor = cosmeticById(equipped.accessory ?? '')?.swatch;

  const situationalActive =
    situationalUntil != null &&
    new Date(situationalUntil).getTime() > Date.now();

  const onSituational = async () => {
    if (situationalActive) return;
    await startSituationalSupport();
    setSituationalUntil(new Date(Date.now() + SITUATIONAL_MS).toISOString());
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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
        <Companion
          vitality={score}
          band={band}
          color={companionColor}
          accessoryColor={accessoryColor}
        />

        <Text className="mt-8 text-3xl font-bold text-ink">
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

      <View className="gap-3 px-6 pb-4">
        <Button
          label={t('home.cravingAction')}
          onPress={() => router.push('/craving')}
        />
        <Button
          label={t('home.logAction')}
          variant="secondary"
          onPress={() => router.push('/log')}
        />
        <Pressable
          onPress={onSituational}
          accessibilityRole="button"
          className="items-center py-1"
        >
          <Text className="text-sm font-medium text-ink-soft">
            {situationalActive
              ? t('home.situationalActive')
              : t('home.situationalStart')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
