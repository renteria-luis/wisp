import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BreathingGuide } from '@/components/craving/BreathingGuide';
import { CravingTimer } from '@/components/craving/CravingTimer';
import { Distraction } from '@/components/craving/Distraction';
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
  const { t } = useTranslation();
  const [tool, setTool] = useState<Tool>('breathe');
  const [saving, setSaving] = useState(false);
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

  const onResisted = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await logResisted();
      if (picked) recordHelped(picked);
      await useEconomy
        .getState()
        .award(BONUS_RESISTED_CRAVING, 'resisted_craving');
      celebrate('💪', t('celebrate.resisted'));
      router.back();
    } catch {
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
    </SafeAreaView>
  );
}
