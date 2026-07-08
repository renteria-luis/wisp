import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Easing, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cravingLift } from '@/components/companion/cravingLift';
import { BreathingGuide } from '@/components/craving/BreathingGuide';
import { CravingTimer } from '@/components/craving/CravingTimer';
import { Distraction } from '@/components/craving/Distraction';
import { BreathePulse } from '@/components/ui/BreathePulse';
import { Button } from '@/components/ui/Button';
import { OptionChip } from '@/components/ui/OptionChip';
import { BONUS_RESISTED_CRAVING } from '@/engine/economy';
import { useCelebration } from '@/store/useCelebration';
import { useCoach } from '@/store/useCoach';
import { useDistractions } from '@/store/useDistractions';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';

type Tool = 'breathe' | 'wait' | 'distract';

const TOOLS: Tool[] = ['breathe', 'wait', 'distract'];

/** Craving toolkit ("panic button"): breathing, a passing-timer, distraction. */
export default function Craving() {
  const router = useRouter();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [tool, setTool] = useState<Tool>('breathe');
  const [saving, setSaving] = useState(false);
  const [breathing, setBreathing] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const logResisted = useLogs((s) => s.logResistedCraving);
  const recordHelped = useDistractions((s) => s.recordHelped);
  const celebrate = useCelebration((s) => s.celebrate);
  const setCoach = useCoach((s) => s.setContext);

  // Tell the Home companion (visible behind this half-sheet) which tool is open
  // so it can coach with contextual lines; clear it when the sheet closes.
  useEffect(() => {
    setCoach(tool);
  }, [tool, setCoach]);
  useEffect(() => () => setCoach(null), [setCoach]);

  // Lift the Home companion up while this sheet is open, and drop it the moment
  // the sheet starts to dismiss — `beforeRemove` fires as soon as the swipe (or
  // a button) commits, so PP glides down with the gesture instead of after it.
  useEffect(() => {
    cravingLift.value = withTiming(1, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    const drop = () => {
      cravingLift.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    };
    const unsub = navigation.addListener('beforeRemove', drop);
    return () => {
      unsub();
      drop();
    };
  }, [navigation]);

  const onResisted = async () => {
    if (saving) return;
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
        router.back();
      }, 1600);
    } catch {
      setBreathing(false);
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
      <View className="flex-row justify-end px-6 pt-5">
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

      <ScrollView contentContainerClassName="gap-5 px-6 pb-6">
        <Text className="text-2xl font-bold text-ink dark:text-neutral-50">
          {t('craving.title')}
        </Text>
        <Text className="text-base leading-6 text-ink-soft dark:text-neutral-300">
          {t('craving.subtitle')}
        </Text>

        <View className="flex-row gap-2">
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

      <View className="px-6 pb-6">
        <Button
          label={t('craving.resisted')}
          onPress={onResisted}
          disabled={saving}
        />
      </View>

      {breathing ? (
        <View className="absolute inset-0 items-center justify-center bg-cream/95 px-8 dark:bg-neutral-950/95">
          <BreathePulse />
          <Text className="mt-8 text-center text-base font-medium text-ink-soft dark:text-neutral-300">
            {t('craving.resistBreath')}
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
