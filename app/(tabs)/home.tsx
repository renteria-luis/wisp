import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SecretCompanion } from '@/components/companion/SecretCompanion';
import { SpeechBubble } from '@/components/companion/SpeechBubble';
import {
  CHARACTER_SPRITES,
  SPRITE_CHARACTER_IDS,
  characterForToday,
  hasSprite,
} from '@/components/companion/sprites';
import { SpriteCompanion } from '@/components/companion/SpriteCompanion';
import { Button } from '@/components/ui/Button';
import { HeartBurst } from '@/components/ui/HeartBurst';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { QuotaBand } from '@/content/companionLines';
import { useCompanionLine } from '@/hooks/useCompanionLine';
import { allowanceForDay } from '@/engine/planEngine';
import {
  requestNotificationPermission,
  startSituationalSupport,
} from '@/notifications/scheduler';
import { personal } from '@/personal/personal.config';
import { useCompanion } from '@/store/useCompanion';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
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
  const notificationsEnabled = useSettings((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettings((s) => s.setNotificationsEnabled);
  const plan = usePlan((s) => s.plan);
  const todayCigarettes = useLogs((s) => s.todayCigarettes);
  const equipped = useCompanion((s) => s.equipped);
  const setCharacter = useCompanion((s) => s.setCharacter);
  const name = userName || personal.dedicateeName;

  // Secret Secret companion (unlocked in onboarding) replaces the creatures.
  const secretCompanionUnlocked = useSettings((s) => s.secretCompanionUnlocked);
  const [secretTrigger, setSecretTrigger] = useState(0);
  // Tap the companion to pick which of the four creatures to show.
  const [pickerOpen, setPickerOpen] = useState(false);
  // Explains what "I'm out / drinking" does, shown when it's activated/tapped.
  const [supportInfo, setSupportInfo] = useState(false);
  // Easter egg: long-press the companion 5× within 3s for a heart burst (§11).
  const [burst, setBurst] = useState(false);
  const [eggVisible, setEggVisible] = useState(false);
  const longPresses = useRef<number[]>([]);
  const onCompanionLongPress = () => {
    const now = Date.now();
    longPresses.current = [
      ...longPresses.current.filter((ts) => now - ts < 3000),
      now,
    ];
    if (longPresses.current.length >= 5) {
      longPresses.current = [];
      setBurst(true);
      setEggVisible(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // The companion looks sad once the day's smoking passes half the quota (any
  // cigarette on cold turkey). Character rotates daily unless one is equipped.
  const dayIndex = plan
    ? Math.max(0, daysBetween(plan.startDate, todayISO()))
    : 0;
  const allowanceToday = plan ? allowanceForDay(plan, dayIndex) : 0;
  const companionSad =
    allowanceToday > 0
      ? todayCigarettes >= allowanceToday / 2
      : todayCigarettes > 0;
  const spriteCharacter = hasSprite(equipped.character)
    ? equipped.character!
    : characterForToday();

  // What the companion "says": by quota band, night, or a once-a-day morning
  // greeting (a craving context takes over inside the hook).
  const hour = new Date().getHours();
  const night = hour >= 23 || hour < 6;
  const quotaPct =
    allowanceToday > 0
      ? todayCigarettes / allowanceToday
      : todayCigarettes > 0
        ? 1
        : 0;
  const band: QuotaBand =
    quotaPct <= 0.3
      ? 'low'
      : quotaPct <= 0.6
        ? 'mid'
        : quotaPct <= 0.9
          ? 'high'
          : 'over';
  const [morningActive, setMorningActive] = useState(
    () =>
      hour >= 5 &&
      hour < 12 &&
      useSettings.getState().lastMorningGreet !== todayISO(),
  );
  useEffect(() => {
    if (!morningActive) return;
    useSettings.getState().setLastMorningGreet(todayISO());
    const id = setTimeout(() => setMorningActive(false), 30_000);
    return () => clearTimeout(id);
  }, [morningActive]);
  const companionLine = useCompanionLine({
    band,
    night,
    morning: morningActive,
    name,
  });

  const situationalActive =
    situationalUntil != null &&
    new Date(situationalUntil).getTime() > Date.now();

  const onSituational = async () => {
    // Already on → just re-explain what it's doing.
    if (situationalActive) {
      setSupportInfo(true);
      return;
    }
    if (!notificationsEnabled) {
      setNotificationsEnabled(await requestNotificationPermission());
    }
    await startSituationalSupport();
    setSituationalUntil(new Date(Date.now() + SITUATIONAL_MS).toISOString());
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSupportInfo(true);
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
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950" edges={['top']}>
      <View className="flex-row items-center justify-end gap-1 px-5 pt-1">
        <ThemeToggle />
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel={t('settings.title')}
          hitSlop={8}
          className="px-2 py-1"
        >
          <Text className="text-xl">⚙️</Text>
        </Pressable>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <SpeechBubble text={companionLine} />
        <View className="mt-2">
          <Pressable
            onPress={() =>
              secretCompanionUnlocked
                ? setSecretTrigger((n) => n + 1)
                : setPickerOpen(true)
            }
            onLongPress={onCompanionLongPress}
            delayLongPress={300}
            accessibilityRole="image"
            accessibilityLabel={companionName}
          >
            {secretCompanionUnlocked ? (
              <SecretCompanion actionTrigger={secretTrigger} />
            ) : (
              <SpriteCompanion character={spriteCharacter} sad={companionSad} />
            )}
          </Pressable>
        </View>

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
        <View className="flex-row justify-center gap-6 pt-1">
          <Pressable
            onPress={() => router.push('/checkin')}
            accessibilityRole="button"
            className="py-1"
          >
            <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
              {t('home.checkInAction')}
            </Text>
          </Pressable>
          <Pressable
            onPress={onSituational}
            accessibilityRole="button"
            className="py-1"
          >
            <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
              {situationalActive
                ? t('home.situationalActive')
                : t('home.situationalStart')}
            </Text>
          </Pressable>
        </View>
      </View>

      {pickerOpen ? (
        <Pressable
          onPress={() => setPickerOpen(false)}
          accessibilityRole="button"
          className="absolute inset-0 items-center justify-center bg-black/30 px-8"
        >
          <View className="w-full max-w-sm rounded-2xl bg-neutral-0 p-6 dark:bg-neutral-900">
            <Text className="mb-4 text-center text-lg font-bold text-ink dark:text-neutral-50">
              {t('home.pickCompanion')}
            </Text>
            <View className="flex-row flex-wrap justify-center gap-3">
              {SPRITE_CHARACTER_IDS.map((id) => {
                const active = spriteCharacter === id;
                return (
                  <Pressable
                    key={id}
                    onPress={() => {
                      setCharacter(id);
                      setPickerOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`items-center rounded-2xl border p-2 ${
                      active
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <Image
                      source={CHARACTER_SPRITES[id]!.base}
                      style={{ width: 66, height: 66 }}
                      contentFit="contain"
                      cachePolicy="memory-disk"
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Pressable>
      ) : null}

      {supportInfo ? (
        <Pressable
          onPress={() => setSupportInfo(false)}
          accessibilityRole="button"
          className="absolute inset-0 items-center justify-center bg-black/30 px-8"
        >
          <View className="w-full max-w-sm rounded-2xl bg-neutral-0 p-6 dark:bg-neutral-900">
            <Text className="text-center text-lg font-bold text-ink dark:text-neutral-50">
              {t('home.situationalInfoTitle')}
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-ink-soft dark:text-neutral-300">
              {t('home.situationalInfoBody')}
            </Text>
            <Text className="mt-4 text-center text-sm font-semibold text-primary-600">
              {t('common.ok')}
            </Text>
          </View>
        </Pressable>
      ) : null}

      <HeartBurst visible={burst} onDone={() => setBurst(false)} />
      {eggVisible ? (
        <Pressable
          onPress={() => setEggVisible(false)}
          className="absolute inset-0 items-center justify-center bg-black/20 px-8"
        >
          <View className="rounded-2xl bg-neutral-0 p-5 dark:bg-neutral-900">
            <Text className="text-center text-base leading-6 text-ink dark:text-neutral-50">
              {personal.easterEggs.companionLongPress}
            </Text>
            <Text className="mt-3 text-center text-xs text-ink-mute dark:text-neutral-400">
              {t('common.close')}
            </Text>
          </View>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}
