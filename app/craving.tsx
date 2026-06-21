import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BreathingGuide } from '@/components/craving/BreathingGuide';
import { CravingTimer } from '@/components/craving/CravingTimer';
import { Distraction } from '@/components/craving/Distraction';
import { Button } from '@/components/ui/Button';
import { OptionChip } from '@/components/ui/OptionChip';
import { BONUS_RESISTED_CRAVING } from '@/engine/economy';
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
  const logResisted = useLogs((s) => s.logResistedCraving);

  const onResisted = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await logResisted();
      await useEconomy
        .getState()
        .award(BONUS_RESISTED_CRAVING, 'resisted_craving');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setSaving(false);
    }
  };

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

      <ScrollView contentContainerClassName="gap-5 px-6 pb-6">
        <Text className="text-2xl font-bold text-ink">
          {t('craving.title')}
        </Text>
        <Text className="text-base leading-6 text-ink-soft">
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
          <Distraction />
        )}
      </ScrollView>

      <View className="px-6 pb-4">
        <Button
          label={t('craving.resisted')}
          onPress={onResisted}
          disabled={saving}
        />
      </View>
    </SafeAreaView>
  );
}
