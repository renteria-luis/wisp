import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cravingLift } from '@/components/companion/cravingLift';
import { BreathingGuide } from '@/components/craving/BreathingGuide';
import { CravingTimer } from '@/components/craving/CravingTimer';
import { Distraction } from '@/components/craving/Distraction';
import { TUTORIAL_STEPS } from '@/components/tutorial/steps';
import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { useTutorialTarget } from '@/components/tutorial/useTutorialTarget';
import { BreathePulse } from '@/components/ui/BreathePulse';
import { Button } from '@/components/ui/Button';
import { OptionChip } from '@/components/ui/OptionChip';
import { BONUS_RESISTED_CRAVING } from '@/engine/economy';
import { useCelebration } from '@/store/useCelebration';
import { useCoach } from '@/store/useCoach';
import { useDistractions } from '@/store/useDistractions';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';
import { useTutorial } from '@/store/useTutorial';
import { logDev } from '@/utils/logger';

type Tool = 'breathe' | 'wait' | 'distract';

const TOOLS: Tool[] = ['breathe', 'wait', 'distract'];

const OPEN = { duration: 300, easing: Easing.out(Easing.cubic) };
const SETTLE = { duration: 200, easing: Easing.out(Easing.cubic) };

/** Craving toolkit ("panic button"): breathing, a passing-timer, distraction. */
export default function Craving() {
  const router = useRouter();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [tool, setTool] = useState<Tool>('breathe');
  const [saving, setSaving] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const logResisted = useLogs((s) => s.logResistedCraving);
  const recordHelped = useDistractions((s) => s.recordHelped);
  const celebrate = useCelebration((s) => s.celebrate);
  const setCoach = useCoach((s) => s.setContext);

  // Guided tour: spotlight targets, a scripted demo of the three tools, and the
  // sheet's drag-to-dismiss locked while the tour drives.
  const tourOn = useTutorial((s) => s.active);
  const tourStepKey = useTutorial((s) =>
    s.active ? TUTORIAL_STEPS[s.stepIndex]?.key : null,
  );
  const toolsTarget = useTutorialTarget('craving-tools');
  const resistedTarget = useTutorialTarget('craving-resisted');
  // The tour demos the three tools by cycling them itself (2s each), and keeps
  // cycling while the user reads. "I resisted" only unlocks once a full pass has
  // played — otherwise the demo could be skipped before it has shown anything.
  const [demoDone, setDemoDone] = useState(false);
  useEffect(() => {
    if (tourStepKey !== 'craving2') {
      setDemoDone(false);
      return;
    }
    const order: Tool[] = ['breathe', 'wait', 'distract'];
    let i = 0;
    setTool(order[0]!);
    const cycle = setInterval(() => {
      i = (i + 1) % order.length;
      setTool(order[i]!);
    }, 2000);
    const unlock = setTimeout(() => setDemoDone(true), 3 * 2000);
    return () => {
      clearInterval(cycle);
      clearTimeout(unlock);
    };
  }, [tourStepKey]);

  // The sheet covers this much of the screen; Home peeks (and coaches) above it.
  // Kept tight so the companion has room to breathe up there.
  const sheetH = Math.round(height * 0.62);
  // Companion lift captured when a drag begins, so the drag is relative to it.
  const savedLift = useSharedValue(1);

  // Tell the Home companion (visible behind this sheet) which tool is open so it
  // can coach with contextual lines; clear it when the sheet closes.
  useEffect(() => {
    setCoach(tool);
  }, [tool, setCoach]);
  useEffect(() => () => setCoach(null), [setCoach]);

  // Slide the sheet up on mount (cravingLift 0→1), and guarantee it's back to 0
  // on unmount so the companion never stays stuck up.
  useEffect(() => {
    cravingLift.value = withTiming(1, OPEN);
    return () => {
      cravingLift.value = withTiming(0, SETTLE);
    };
  }, []);

  // Dismiss once — the gesture and the buttons both route through here.
  const closed = useRef(false);
  const goBack = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    router.back();
  }, [router]);

  const close = useCallback(() => {
    cravingLift.value = withTiming(0, SETTLE, (fin) => {
      if (fin) runOnJS(goBack)();
    });
  }, [goBack]);

  // Drag the grabber/header: translationY maps straight onto the companion's
  // lift (1 = sheet fully open, 0 = dismissed), so PP tracks the finger exactly.
  const pan = Gesture.Pan()
    .enabled(!tourOn)
    .onStart(() => {
      savedLift.value = cravingLift.value;
    })
    .onUpdate((e) => {
      const next = savedLift.value - e.translationY / sheetH;
      cravingLift.value = Math.min(1, Math.max(0, next));
    })
    .onEnd((e) => {
      const shouldClose = cravingLift.value < 0.62 || e.velocityY > 800;
      if (shouldClose) {
        cravingLift.value = withTiming(0, SETTLE, (fin) => {
          if (fin) runOnJS(goBack)();
        });
      } else {
        cravingLift.value = withTiming(1, SETTLE);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - cravingLift.value) * sheetH }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: cravingLift.value * 0.35,
  }));

  const onResisted = async () => {
    if (saving) return;
    // In the tour: play the same celebration, but log nothing and award no
    // coins — then hand control straight back to the tour.
    if (tourOn) {
      celebrate('💪', t('celebrate.resisted'));
      useTutorial.getState().signalAction('resisted');
      return;
    }
    setSaving(true);
    setBreathing(true);
    try {
      await logResisted();
      if (picked) recordHelped(picked);
      await useEconomy
        .getState()
        .award(BONUS_RESISTED_CRAVING, 'resisted_craving');
      // A calm breathing beat, then celebrate + close.
      setTimeout(() => {
        celebrate('💪', t('celebrate.resisted'));
        close();
      }, 1600);
    } catch (err) {
      logDev('craving', err);
      setBreathing(false);
      setSaving(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          style={[StyleSheet.absoluteFill, backdropStyle, { backgroundColor: '#000' }]}
        />
      </Pressable>

      <Animated.View
        style={[
          sheetStyle,
          { position: 'absolute', left: 0, right: 0, bottom: 0, height: sheetH },
        ]}
      >
        <View className="flex-1 overflow-hidden rounded-t-[22px] bg-cream dark:bg-neutral-950">
          {/* Drag zone: the grabber, title + subtitle all pull the sheet down. */}
          <GestureDetector gesture={pan}>
            <View className="px-6 pt-3">
              <View className="mb-3 h-1.5 w-10 self-center rounded-full bg-neutral-300 dark:bg-neutral-700" />
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 pr-3 text-2xl font-bold text-ink dark:text-neutral-50">
                  {t('craving.title')}
                </Text>
                <Pressable
                  onPress={close}
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
              <Text className="mt-1 text-base leading-6 text-ink-soft dark:text-neutral-300">
                {t('craving.subtitle')}
              </Text>
            </View>
          </GestureDetector>

          <ScrollView contentContainerClassName="gap-4 px-6 pb-2 pt-3">
            <View ref={toolsTarget.ref} className="flex-row gap-2">
              {TOOLS.map((tl) => (
                <OptionChip
                  key={tl}
                  label={t(`craving.tools.${tl}`)}
                  selected={tool === tl}
                  onPress={() => setTool(tl)}
                />
              ))}
            </View>

            {tool === 'breathe' ? (
              <BreathingGuide />
            ) : tool === 'wait' ? (
              <CravingTimer />
            ) : (
              <Distraction
                selected={picked}
                onSelect={setPicked}
                onResisted={onResisted}
              />
            )}
          </ScrollView>

          <View className="px-6 pt-1" style={{ paddingBottom: insets.bottom + 10 }}>
            <View ref={resistedTarget.ref}>
              <Button
                label={t('craving.resisted')}
                onPress={onResisted}
                disabled={saving || (tourOn && !demoDone)}
              />
            </View>
          </View>

          {breathing ? (
            <View className="absolute inset-0 items-center justify-center bg-cream/95 px-8 dark:bg-neutral-950/95">
              <BreathePulse />
              <Text className="mt-8 text-center text-base font-medium text-ink-soft dark:text-neutral-300">
                {t('craving.resistBreath')}
              </Text>
            </View>
          ) : null}
        </View>
      </Animated.View>

      <TutorialOverlay scope="modal" />
    </View>
  );
}
