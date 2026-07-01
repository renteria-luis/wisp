import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';

import type { HealthMilestone } from '@/engine/health';

/**
 * The extra-info popup for a recovery milestone (title, when, the longer detail,
 * a fun fact, its real citation and the disclaimer). Shared so it can be opened
 * from a milestone row, the "Towards …" countdown bar, or the Plan next-milestone
 * card.
 */
export function MilestoneDetailModal({
  milestone,
  onClose,
}: {
  milestone: HealthMilestone;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const id = milestone.id;
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/40 px-6"
      >
        <View className="w-full rounded-2xl bg-neutral-0 p-6 dark:bg-neutral-900">
          <View className="flex-row items-baseline justify-between">
            <Text className="flex-1 pr-2 text-lg font-bold text-ink dark:text-neutral-50">
              {t(`health.milestones.${id}.title`)}
            </Text>
            <Text className="text-xs text-ink-mute dark:text-neutral-400">
              {t(`health.milestones.${id}.when`)}
            </Text>
          </View>
          <Text className="mt-2 text-sm leading-5 text-ink-soft dark:text-neutral-300">
            {t(`health.milestones.${id}.detail`)}
          </Text>
          <Text className="mt-3 text-xs leading-4 text-ink-soft dark:text-neutral-300">
            💡 {t(`health.milestones.${id}.fact`)}
          </Text>
          <Text className="mt-3 text-[11px] text-ink-mute dark:text-neutral-400">
            {t('health.sourceLabel')}: {milestone.source}
          </Text>
          <Text className="mt-1 text-[11px] text-ink-mute dark:text-neutral-400">
            {t('health.disclaimer')}
          </Text>
          <Pressable onPress={onClose} className="mt-4 self-end">
            <Text className="text-sm font-semibold text-primary-600">
              {t('common.close')}
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
