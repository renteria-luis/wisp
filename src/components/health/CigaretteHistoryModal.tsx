import { type Href, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TutorialOverlay } from '@/components/tutorial/TutorialOverlay';
import { useTutorialTarget } from '@/components/tutorial/useTutorialTarget';
import { Button } from '@/components/ui/Button';
import {
  type CigaretteRow,
  getAllCigarettes,
} from '@/data/repositories/cigaretteLog';
import { useLogs } from '@/store/useLogs';
import { type TrendRange, useSettings } from '@/store/useSettings';
import { useTutorial } from '@/store/useTutorial';
import { useTutorialSandbox } from '@/store/useTutorialSandbox';

const RANGES: TrendRange[] = ['week', 'month', 'all'];

/** Local day key (YYYY-MM-DD) — matches how the DB groups by day. */
function dayKeyOf(iso: string): string {
  return iso.slice(0, 10);
}

function formatDay(key: string): string {
  return new Date(`${key}T12:00:00`).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
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

function Entry({ row }: { row: CigaretteRow }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen((o) => !o)}
      accessibilityRole="button"
      className="rounded-xl bg-neutral-50 p-2.5 dark:bg-neutral-800"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-ink dark:text-neutral-50">
          🚬 {formatTime(row.timestamp)}
        </Text>
        <Text className="text-xs text-ink-mute dark:text-neutral-400">
          {open ? '▲' : '▼'}
        </Text>
      </View>
      {open ? (
        <View className="mt-2 gap-1 border-t border-neutral-200 pt-2 dark:border-neutral-700">
          {row.trigger_category ? (
            <Detail
              label={t('log.triggerLabel')}
              value={t(`triggers.${row.trigger_category}`)}
            />
          ) : null}
          <Detail
            label={t('log.sourceLabel')}
            value={row.gifted ? t('history.gifted') : t('history.mine')}
          />
          <Detail
            label={t('log.mannerLabel')}
            value={row.shared ? t('history.shared') : t('history.whole')}
          />
          {row.note ? (
            <Detail label={t('history.noteLabel')} value={row.note} />
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

/** History of every logged cigarette, grouped by day, with a day filter and a
 *  trend-range switch that drives the Progress graph. */
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
  const range = useSettings((s) => s.trendRange);
  const setRange = useSettings((s) => s.setTrendRange);
  const [rows, setRows] = useState<CigaretteRow[]>([]);
  const [dayFilter, setDayFilter] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null);
  // During the tour, show the sandbox's demo cigarette instead of real logs —
  // carrying the trigger/note the user actually picked (or none at all).
  const tourOn = useTutorial((s) => s.active);
  const sbxCigs = useTutorialSandbox((s) => s.cigs);
  const cigTarget = useTutorialTarget('history-cig');
  const addTarget = useTutorialTarget('history-add');

  useEffect(() => {
    if (!visible) return;
    if (tourOn) {
      setRows(
        sbxCigs.map((cg, i) => ({
          id: -(i + 1),
          timestamp: cg.timestamp,
          trigger_category: cg.trigger,
          note: cg.note,
          shared: cg.shared ? 1 : 0,
          gifted: cg.gifted ? 1 : 0,
        })),
      );
      return;
    }
    let cancelled = false;
    getAllCigarettes()
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, revision, tourOn, sbxCigs]);

  // Rows are already newest-first; keep that order within each day group.
  const groups = useMemo(() => {
    const map = new Map<string, CigaretteRow[]>();
    for (const r of rows) {
      const k = dayKeyOf(r.timestamp);
      const arr = map.get(k);
      if (arr) arr.push(r);
      else map.set(k, [r]);
    }
    return [...map.entries()]
      .map(([key, items]) => ({ key, items }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [rows]);

  const visibleGroups = dayFilter
    ? groups.filter((g) => g.key === dayFilter)
    : groups;

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

        <ScrollView contentContainerClassName="gap-3 px-6 pb-8">
          {/* Trend range → drives the Progress graph span. */}
          <View>
            <Text className="mb-1.5 text-xs font-semibold text-ink-soft dark:text-neutral-300">
              {t('history.rangeLabel')}
            </Text>
            <View className="flex-row gap-2">
              {RANGES.map((r) => {
                const active = range === r;
                const label =
                  r === 'week'
                    ? t('history.rangeWeek')
                    : r === 'month'
                      ? t('history.rangeMonth')
                      : t('history.rangeAll');
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRange(r)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`flex-1 items-center rounded-xl border py-2 ${
                      active
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                        : 'border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        active
                          ? 'text-primary-700 dark:text-primary-100'
                          : 'text-ink-soft dark:text-neutral-300'
                      }`}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="mt-1 text-[11px] text-ink-mute dark:text-neutral-400">
              {t('history.rangeHint')}
            </Text>
          </View>

          <View className="flex-row">
            <View ref={addTarget.ref}>
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
          </View>

          {groups.length === 0 ? (
            <Text className="mt-8 text-center text-sm text-ink-mute dark:text-neutral-400">
              {t('history.empty')}
            </Text>
          ) : (
            <>
              {/* Day filter — pick one of the days that actually has logs. */}
              <View>
                <Pressable
                  onPress={() => setFilterOpen((o) => !o)}
                  accessibilityRole="button"
                  className="flex-row items-center justify-between rounded-xl border border-neutral-200 bg-neutral-0 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
                >
                  <Text className="text-sm text-ink-soft dark:text-neutral-300">
                    {t('history.filterLabel')}
                  </Text>
                  <Text className="text-sm font-semibold text-primary-600">
                    {dayFilter ? formatDay(dayFilter) : t('history.allDays')}{' '}
                    {filterOpen ? '▲' : '▼'}
                  </Text>
                </Pressable>
                {filterOpen ? (
                  <View className="mt-1 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <Pressable
                      onPress={() => {
                        setDayFilter(null);
                        setFilterOpen(false);
                      }}
                      className="border-b border-neutral-100 bg-neutral-0 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <Text className="text-sm text-ink dark:text-neutral-50">
                        {t('history.allDays')}
                      </Text>
                    </Pressable>
                    {groups.map((g) => (
                      <Pressable
                        key={g.key}
                        onPress={() => {
                          setDayFilter(g.key);
                          setOpenDay(g.key);
                          setFilterOpen(false);
                        }}
                        className="flex-row items-center justify-between border-b border-neutral-100 bg-neutral-0 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        <Text className="text-sm text-ink dark:text-neutral-50">
                          {formatDay(g.key)}
                        </Text>
                        <Text className="text-xs font-semibold text-ink-mute dark:text-neutral-400">
                          {g.items.length} 🚬
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              {visibleGroups.map((g, gi) => {
                // During the tour, auto-open the (only) day so the cigarette is
                // visible, and spotlight it.
                const dayOpen = openDay === g.key || (tourOn && gi === 0);
                return (
                  <View
                    key={g.key}
                    ref={gi === 0 ? cigTarget.ref : undefined}
                    className="rounded-2xl border border-neutral-200 bg-neutral-0 p-3 dark:border-neutral-800 dark:bg-neutral-900"
                  >
                    <Pressable
                      onPress={() => setOpenDay(dayOpen ? null : g.key)}
                      accessibilityRole="button"
                      className="flex-row items-center justify-between"
                    >
                      <Text className="text-sm font-bold text-ink dark:text-neutral-50">
                        {formatDay(g.key)}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        <Text className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                          {t('history.dayTotal', { count: g.items.length })}
                        </Text>
                        <Text className="text-xs text-ink-mute dark:text-neutral-400">
                          {dayOpen ? '▲' : '▼'}
                        </Text>
                      </View>
                    </Pressable>
                    {dayOpen ? (
                      <View className="mt-2 gap-1.5">
                        {g.items.map((r) => (
                          <Entry key={r.id} row={r} />
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
        <TutorialOverlay scope="modal" />
      </SafeAreaView>
    </Modal>
  );
}
