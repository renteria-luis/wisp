import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import {
  type CigaretteRow,
  getAllCigarettes,
} from '@/data/repositories/cigaretteLog';
import { useLogs } from '@/store/useLogs';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-xs text-ink-mute dark:text-neutral-400">{label}</Text>
      <Text className="flex-1 text-right text-xs text-ink-soft dark:text-neutral-300">
        {value}
      </Text>
    </View>
  );
}

/** A chronological list of every logged cigarette; tap a row for its details. */
export function CigaretteHistoryModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const revision = useLogs((s) => s.revision);
  const [rows, setRows] = useState<CigaretteRow[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    getAllCigarettes()
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, revision]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-cream dark:bg-neutral-950">
        <View className="flex-row items-center justify-between px-6 pb-2 pt-5">
          <Text className="text-xl font-bold text-ink dark:text-neutral-50">
            {t('history.title')}
          </Text>
          <Pressable onPress={onClose} hitSlop={8} className="px-2 py-1">
            <Text className="text-base font-medium text-primary-600">
              {t('common.close')}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-2 px-6 pb-8">
          <View className="mb-1 flex-row">
            <Button
              label={t('history.add')}
              size="sm"
              variant="secondary"
              onPress={() => {
                onClose();
                router.push('/manual-log' as Href);
              }}
            />
          </View>

          {rows.length === 0 ? (
            <Text className="mt-8 text-center text-sm text-ink-mute dark:text-neutral-400">
              {t('history.empty')}
            </Text>
          ) : (
            rows.map((r) => {
              const open = openId === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setOpenId(open ? null : r.id)}
                  accessibilityRole="button"
                  className="rounded-xl border border-neutral-200 bg-neutral-0 p-3 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-medium text-ink dark:text-neutral-50">
                      🚬 {formatWhen(r.timestamp)}
                    </Text>
                    <Text className="text-xs text-ink-mute dark:text-neutral-400">
                      {open ? '▲' : '▼'}
                    </Text>
                  </View>
                  {open ? (
                    <View className="mt-2 gap-1 border-t border-neutral-100 pt-2 dark:border-neutral-800">
                      {r.trigger_category ? (
                        <Detail
                          label={t('log.triggerLabel')}
                          value={t(`triggers.${r.trigger_category}`)}
                        />
                      ) : null}
                      <Detail
                        label={t('log.sourceLabel')}
                        value={r.gifted ? t('history.gifted') : t('history.mine')}
                      />
                      <Detail
                        label={t('log.mannerLabel')}
                        value={r.shared ? t('history.shared') : t('history.whole')}
                      />
                      {r.note ? (
                        <Detail label={t('history.noteLabel')} value={r.note} />
                      ) : null}
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
