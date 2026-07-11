import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cravingLift } from '@/components/companion/cravingLift';
import { useTutorialTarget } from '@/components/tutorial/useTutorialTarget';
import { SecretCompanion } from '@/components/companion/SecretCompanion';
import { SpeechBubble } from '@/components/companion/SpeechBubble';
import {
  CHARACTER_SPRITES,
  SPRITE_CHARACTER_IDS,
  hasSprite,
} from '@/components/companion/sprites';
import { SpriteCompanion } from '@/components/companion/SpriteCompanion';
import { WispCircle } from '@/components/companion/WispCircle';
import { Button } from '@/components/ui/Button';
import { HeartBurst } from '@/components/ui/HeartBurst';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import type { QuotaBand } from '@/content/companionLines';
import { useCompanionLine } from '@/hooks/useCompanionLine';
import { useMissedDays } from '@/hooks/useMissedDays';
import { allowanceForDay } from '@/engine/planEngine';
import {
  requestNotificationPermission,
  startSituationalSupport,
} from '@/notifications/scheduler';
import { personal } from '@/personal/personal.config';
import { useCoach } from '@/store/useCoach';
import { useCompanion } from '@/store/useCompanion';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
import { useTutorial } from '@/store/useTutorial';
import { useTutorialSandbox } from '@/store/useTutorialSandbox';
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
  const todayCigarettesReal = useLogs((s) => s.todayCigarettes);
  const lastCigaretteAt = useLogs((s) => s.lastCigaretteAt);
  // During the guided tour, Home reflects the sandbox (a clean practice world).
  const tourOn = useTutorial((s) => s.active);
  const sbxCigs = useTutorialSandbox((s) => s.cigs.length);
  const todayCigarettes = tourOn ? sbxCigs : todayCigarettesReal;
  const equipped = useCompanion((s) => s.equipped);
  const setCharacter = useCompanion((s) => s.setCharacter);
  const name = userName || personal.dedicateeName;

  // Secret Secret companion (unlocked in onboarding) replaces the creatures.
  const secretCompanionUnlocked = useSettings((s) => s.secretCompanionUnlocked);
  const [secretTrigger, setSecretTrigger] = useState(0);
  // The craving sheet sets a coach context while it's open — the companion
  // stands and shuts its eyes to breathe along until it closes.
  const cravingActive = useCoach((s) => s.context) != null;

  // When the secret companion is unlocked, adopt its name by default — unless
  // the user has already chosen a custom one.
  useEffect(() => {
    if (
      secretCompanionUnlocked &&
      (!companionName || companionName === personal.companionDefaultName)
    ) {
      useSettings.getState().setCompanionName('Secret');
    }
  }, [secretCompanionUnlocked, companionName]);
  // PP smoothly lifts up while the craving sheet is open (driven by that
  // screen's mount/unmount via the shared `cravingLift` value).
  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cravingLift.value * -110 }],
  }));
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

  // The companion turns sad after smoking ~40% of the day's quota (any
  // cigarette on cold turkey) — but only for 3h since the last cigarette. Smoke
  // again and it re-sads for another 3h. A slow tick re-evaluates that window
  // while the screen stays open. Character rotates daily unless one is equipped.
  const [sadTick, setSadTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setSadTick(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const SAD_WINDOW_MS = 3 * 60 * 60 * 1000;
  const dayIndex = plan
    ? Math.max(0, daysBetween(plan.startDate, todayISO()))
    : 0;
  const allowanceToday = plan ? allowanceForDay(plan, dayIndex) : 0;
  const overQuota =
    allowanceToday > 0
      ? todayCigarettes >= allowanceToday * 0.4
      : todayCigarettes > 0;
  const lastCigMs = lastCigaretteAt ? new Date(lastCigaretteAt).getTime() : 0;
  const recentCigarette = lastCigMs > 0 && sadTick - lastCigMs < SAD_WINDOW_MS;
  // Keep the companion content during the tour (the sandbox is a clean slate).
  const companionSad = !tourOn && overQuota && recentCigarette;
  // Eyes close while the companion is pressed and held (a quick tap = a blink).
  const [holdClose, setHoldClose] = useState(false);

  // Nudge to backfill days the plan expected logs for but has none.
  const { count: missedCount, dismiss: dismissMissed } = useMissedDays();

  // Guided tour: highlight targets, auto-run once after onboarding, replay via ?.
  const logTarget = useTutorialTarget('home-log');
  const cravingTarget = useTutorialTarget('home-craving');
  const startTour = useTutorial((s) => s.start);
  const tutorialCompleted = useSettings((s) => s.tutorialCompleted);
  const onboardingCompleted = useSettings((s) => s.onboardingCompleted);
  const [replayAsk, setReplayAsk] = useState(false);
  useEffect(() => {
    if (onboardingCompleted && !tutorialCompleted && !tourOn) {
      const id = setTimeout(() => startTour(), 600);
      return () => clearTimeout(id);
    }
  }, [onboardingCompleted, tutorialCompleted, tourOn, startTour]);

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
        <Pressable
          onPress={() => setReplayAsk(true)}
          accessibilityRole="button"
          accessibilityLabel={t('tutorial.replayA11y')}
          hitSlop={8}
          className="px-2 py-1"
        >
          <Text className="text-xl">❓</Text>
        </Pressable>
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
        <Animated.View
          style={[{ width: '100%', alignItems: 'center' }, liftStyle]}
        >
        <SpeechBubble text={companionLine} />
        <View className="mt-2">
          <Pressable
            onPress={() =>
              secretCompanionUnlocked
                ? setSecretTrigger((n) => n + 1)
                : setPickerOpen(true)
            }
            onPressIn={() => setHoldClose(true)}
            onPressOut={() => setHoldClose(false)}
            onLongPress={onCompanionLongPress}
            delayLongPress={300}
            accessibilityRole="image"
            accessibilityLabel={companionName}
          >
            {secretCompanionUnlocked ? (
              <SecretCompanion
                actionTrigger={secretTrigger}
                sad={companionSad}
                cravingActive={cravingActive}
                holdClose={holdClose}
              />
            ) : hasSprite(equipped.character) ? (
              <SpriteCompanion
                character={equipped.character!}
                sad={companionSad}
                cravingActive={cravingActive}
                holdClose={holdClose}
              />
            ) : (
              <WispCircle />
            )}
          </Pressable>
        </View>

        {status ? (
          <View className="mt-8 rounded-full bg-primary-100 px-5 py-2">
            {/* explicit family: iOS won't synthesise a bold weight for Changa */}
            <Text
              className="text-primary-700"
              style={{ fontFamily: 'Changa_700Bold', fontSize: 15 }}
            >
              {status}
            </Text>
          </View>
        ) : null}
        </Animated.View>
      </View>

      <View className="gap-3 px-6 pb-4">
        <View ref={cravingTarget.ref}>
          <Button
            label={t('home.cravingAction')}
            onPress={() => router.push('/craving')}
          />
        </View>
        <View ref={logTarget.ref}>
          <Button
            label={t('home.logAction')}
            variant="secondary"
            onPress={() => router.push('/log')}
          />
        </View>
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

      {missedCount > 0 ? (
        <View className="absolute inset-0 items-center justify-center bg-black/40 px-8">
          <View className="w-full max-w-sm rounded-2xl bg-neutral-0 p-6 dark:bg-neutral-900">
            <Text className="text-center text-lg font-bold text-ink dark:text-neutral-50">
              {t('missed.title')}
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-ink-soft dark:text-neutral-300">
              {missedCount === 1
                ? t('missed.oneDay')
                : t('missed.manyDays', { count: missedCount })}
            </Text>
            <View className="mt-5 gap-2">
              <Button
                label={t('missed.addManually')}
                onPress={() => {
                  dismissMissed();
                  router.push('/manual-log' as Href);
                }}
              />
              <Button
                label={t('missed.skip')}
                variant="ghost"
                onPress={dismissMissed}
              />
            </View>
          </View>
        </View>
      ) : null}

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
              <Pressable
                key="wisp"
                onPress={() => {
                  setCharacter('char_wisp');
                  setPickerOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: !hasSprite(equipped.character) }}
                className={`items-center rounded-2xl border p-2 ${
                  !hasSprite(equipped.character)
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <View className="h-[66px] w-[66px] items-center justify-center rounded-full bg-primary-100">
                  <View className="h-9 w-9 rounded-full bg-primary-400" />
                </View>
              </Pressable>
              {SPRITE_CHARACTER_IDS.map((id) => {
                const active = equipped.character === id;
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

      {replayAsk ? (
        <Pressable
          onPress={() => setReplayAsk(false)}
          accessibilityRole="button"
          className="absolute inset-0 items-center justify-center bg-black/30 px-8"
        >
          <View className="w-full max-w-sm rounded-2xl bg-neutral-0 p-6 dark:bg-neutral-900">
            <Text className="text-center text-lg font-bold text-ink dark:text-neutral-50">
              {t('tutorial.replayTitle')}
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-ink-soft dark:text-neutral-300">
              {t('tutorial.replayBody')}
            </Text>
            <View className="mt-5 gap-2">
              <Button
                label={t('tutorial.replayConfirm')}
                onPress={() => {
                  setReplayAsk(false);
                  startTour();
                }}
              />
              <Button
                label={t('common.cancel')}
                variant="ghost"
                onPress={() => setReplayAsk(false)}
              />
            </View>
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
