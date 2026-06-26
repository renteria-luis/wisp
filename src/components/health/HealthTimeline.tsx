import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  HEALTH_MILESTONES,
  HEALTH_PHASES,
  type HealthMilestone,
  currentPhaseId,
  milestoneTimeline,
  nextMilestone,
  reachedCount,
} from '@/engine/health';
import { colors } from '@/theme/tokens';
import { formatCountDown, formatCountUp } from '@/utils/duration';

const HOUR_MS = 3_600_000;

/** Re-renders once a second so the counters and countdown stay live. */
function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

type NodeState = 'reached' | 'current' | 'future';

function Check({ color = colors.neutral['0'] }: { color?: string }) {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Path
        d="M5 13 L10 18 L19 6"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function Node({ state }: { state: NodeState }) {
  return (
    <View className="h-5 w-5 items-center justify-center">
      <View
        style={{
          height: 18,
          width: 18,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor:
            state === 'reached'
              ? colors.primary['500']
              : state === 'current'
                ? colors.neutral['0']
                : colors.neutral['100'],
          borderWidth: state === 'reached' ? 0 : 2,
          borderColor:
            state === 'current' ? colors.accent['500'] : colors.neutral['300'],
        }}
      >
        {state === 'reached' ? (
          <Check />
        ) : state === 'current' ? (
          <View
            style={{
              height: 6,
              width: 6,
              borderRadius: 999,
              backgroundColor: colors.accent['500'],
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

function MilestoneRow({
  id,
  state,
  onPress,
}: {
  id: string;
  state: NodeState;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const done = state !== 'future';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row gap-3 py-1"
    >
      <View className="w-5 items-center pt-0.5">
        <Node state={state} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-sm font-semibold ${done ? 'text-ink dark:text-neutral-50' : 'text-ink-mute dark:text-neutral-500'}`}
          >
            {t(`health.milestones.${id}.title`)}
          </Text>
          <Text className="text-[11px] text-ink-mute dark:text-neutral-400">
            {t(`health.milestones.${id}.when`)}
          </Text>
        </View>
        <Text
          className={`mt-0.5 text-xs leading-4 ${done ? 'text-ink-soft dark:text-neutral-300' : 'text-ink-mute dark:text-neutral-500'}`}
        >
          {t(`health.milestones.${id}.body`)}
        </Text>
      </View>
    </Pressable>
  );
}

function PhaseSection({
  phaseId,
  state,
  reachedInPhase,
  total,
  expanded,
  onToggle,
  children,
}: {
  phaseId: string;
  state: 'done' | 'current' | 'locked';
  reachedInPhase: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const badge = state === 'done' ? '✓' : state === 'locked' ? '🔒' : '';
  return (
    <View className="border-t border-neutral-100 py-2 dark:border-neutral-800">
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        className="flex-row items-center justify-between py-1"
      >
        <View className="flex-1 flex-row items-center gap-2">
          <Text className="text-xs text-ink-mute dark:text-neutral-400">
            {expanded ? '▾' : '▸'}
          </Text>
          <Text
            className={`text-sm font-semibold ${state === 'locked' ? 'text-ink-mute dark:text-neutral-500' : 'text-ink dark:text-neutral-50'}`}
          >
            {t(`health.phases.${phaseId}`)}
          </Text>
          {badge ? <Text className="text-xs">{badge}</Text> : null}
        </View>
        <Text className="text-[11px] text-ink-mute dark:text-neutral-400">
          {reachedInPhase}/{total}
        </Text>
      </Pressable>
      {expanded ? <View className="mt-1 gap-1 pl-1">{children}</View> : null}
    </View>
  );
}

function DetailModal({
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
        <View className="w-full rounded-2xl bg-neutral-0 p-5 dark:bg-neutral-900">
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

type Props = {
  recoveryStartMs: number;
  setbackHours: number;
  smokeFreeSinceMs: number;
  overQuota?: boolean;
};

/** The recovery hero: phased milestones that light up as recovery hours grow,
 *  a live smoke-free counter and a live countdown to the next milestone. */
export function HealthTimeline({
  recoveryStartMs,
  setbackHours,
  smokeFreeSinceMs,
  overQuota = false,
}: Props) {
  const { t } = useTranslation();
  const now = useNow(1000);

  const recoveryHours = Math.max(
    0,
    (now - recoveryStartMs) / HOUR_MS - setbackHours,
  );
  const smokeFreeSeconds = Math.max(0, (now - smokeFreeSinceMs) / 1000);
  const timeline = milestoneTimeline(recoveryHours);
  const reachedById = new Map(timeline.map((m) => [m.milestone.id, m]));
  const reached = reachedCount(recoveryHours);
  const total = HEALTH_MILESTONES.length;
  const next = nextMilestone(recoveryHours);
  const phaseId = currentPhaseId(recoveryHours);
  const phaseIndex = HEALTH_PHASES.findIndex((p) => p.id === phaseId);
  const secondsToNext = next
    ? Math.max(0, (next.milestone.atHours - recoveryHours) * 3600)
    : 0;

  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([phaseId]),
  );
  const [detailId, setDetailId] = useState<string | null>(null);

  // Keep the current phase open as it advances (without fighting manual toggles).
  useEffect(() => {
    setExpanded((prev) =>
      prev.has(phaseId) ? prev : new Set(prev).add(phaseId),
    );
  }, [phaseId]);

  const detail = detailId
    ? HEALTH_MILESTONES.find((m) => m.id === detailId)
    : null;

  return (
    <View className="rounded-2xl border border-neutral-200 bg-neutral-0 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-ink dark:text-neutral-50">
          {t('health.title')}
        </Text>
        <View className="rounded-full bg-primary-100 px-2.5 py-1 dark:bg-primary-900">
          <Text className="text-xs font-semibold text-primary-700 dark:text-primary-100">
            {t('health.count', { reached, total })}
          </Text>
        </View>
      </View>

      <Text className="mt-1 text-xs text-ink-mute dark:text-neutral-400">
        {t('health.sinceLast', { time: formatCountUp(smokeFreeSeconds, t) })}
      </Text>

      {overQuota ? (
        <Text className="mt-3 rounded-xl bg-accent-50 p-3 text-xs leading-5 text-accent-700 dark:bg-accent-900 dark:text-accent-100">
          {t('health.setback')}
        </Text>
      ) : null}

      {next ? (
        <View className="mt-3 rounded-xl bg-primary-50 p-3 dark:bg-primary-900">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 pr-2 text-xs font-medium text-ink-soft dark:text-neutral-200">
              {t('health.towards', {
                title: t(`health.milestones.${next.milestone.id}.title`),
              })}
            </Text>
            <Text className="text-xs font-bold text-primary-700 dark:text-primary-100">
              {formatCountDown(secondsToNext, t)}
            </Text>
          </View>
          <View className="mt-2">
            <ProgressBar progress={next.progress} />
          </View>
        </View>
      ) : (
        <Text className="mt-3 rounded-xl bg-primary-50 p-3 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-100">
          {t('health.allReached')}
        </Text>
      )}

      <View className="mt-3">
        {HEALTH_PHASES.map((phase, i) => {
          const reachedInPhase = phase.milestones.filter(
            (m) => reachedById.get(m.id)?.reached,
          ).length;
          const state =
            i < phaseIndex ? 'done' : i === phaseIndex ? 'current' : 'locked';
          return (
            <PhaseSection
              key={phase.id}
              phaseId={phase.id}
              state={state}
              reachedInPhase={reachedInPhase}
              total={phase.milestones.length}
              expanded={expanded.has(phase.id)}
              onToggle={() =>
                setExpanded((prev) => {
                  const set = new Set(prev);
                  if (set.has(phase.id)) set.delete(phase.id);
                  else set.add(phase.id);
                  return set;
                })
              }
            >
              {phase.milestones.map((m) => {
                const node: NodeState = reachedById.get(m.id)?.reached
                  ? 'reached'
                  : m.id === next?.milestone.id
                    ? 'current'
                    : 'future';
                return (
                  <MilestoneRow
                    key={m.id}
                    id={m.id}
                    state={node}
                    onPress={() => setDetailId(m.id)}
                  />
                );
              })}
            </PhaseSection>
          );
        })}
      </View>

      <Text className="mt-3 text-[11px] leading-4 text-ink-mute dark:text-neutral-400">
        {t('health.disclaimer')}
      </Text>

      {detail ? (
        <DetailModal milestone={detail} onClose={() => setDetailId(null)} />
      ) : null}
    </View>
  );
}
