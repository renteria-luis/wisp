import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
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
  recoveryHoursFrom,
} from '@/engine/health';
import { colors } from '@/theme/tokens';
import { formatCountDown, formatCountUp } from '@/utils/duration';

const HOUR_MS = 3_600_000;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
type PhaseState = 'done' | 'current' | 'locked';

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
  isLast,
  onPress,
}: {
  id: string;
  state: NodeState;
  isLast: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const done = state !== 'future';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="flex-row gap-3"
    >
      <View className="w-5 items-center">
        <View className="pt-1">
          <Node state={state} />
        </View>
        {!isLast ? (
          <View
            style={{ marginTop: 2 }}
            className={`w-0.5 flex-1 ${state === 'reached' ? 'bg-primary-300 dark:bg-primary-700' : 'bg-neutral-200 dark:bg-neutral-700'}`}
          />
        ) : null}
      </View>
      <View className="flex-1 pb-2">
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

function PhaseCard({
  phaseId,
  numeral,
  state,
  reachedInPhase,
  total,
  expanded,
  onToggle,
  countdown,
  children,
}: {
  phaseId: string;
  numeral: string;
  state: PhaseState;
  reachedInPhase: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  countdown?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const name = `${numeral}. ${t(`health.phases.${phaseId}.name`)}`;
  const subtitle = t(`health.phases.${phaseId}.subtitle`);

  if (state === 'current') {
    // The active phase: an eye-catching gradient header + white body.
    return (
      <View className="overflow-hidden rounded-2xl border border-accent-200 dark:border-accent-800">
        <Pressable onPress={onToggle} accessibilityRole="button">
          <View className="overflow-hidden px-4 py-3">
            <LinearGradient
              colors={[colors.accent['400'], colors.accent['600']]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-white">{name}</Text>
              <Text className="text-xs font-semibold text-white/90">
                {reachedInPhase}/{total}
              </Text>
            </View>
            <Text className="mt-0.5 text-xs text-white/80">{subtitle}</Text>
          </View>
        </Pressable>
        <View className="bg-neutral-0 px-4 py-3 dark:bg-neutral-900">
          {countdown}
          {expanded ? <View className="mt-3">{children}</View> : null}
        </View>
      </View>
    );
  }

  const done = state === 'done';
  return (
    <View
      className={`overflow-hidden rounded-2xl border ${
        done
          ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900'
          : 'border-neutral-200 bg-neutral-0 dark:border-neutral-800 dark:bg-neutral-900'
      }`}
    >
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        className="flex-row items-center justify-between px-4 py-3"
      >
        <View className="flex-1 flex-row items-center gap-2">
          <Text>{done ? '✅' : '🔒'}</Text>
          <View className="flex-1">
            <Text
              className={`text-base font-bold ${done ? 'text-ink dark:text-neutral-50' : 'text-ink-mute dark:text-neutral-500'}`}
            >
              {name}
            </Text>
            <Text className="text-xs text-ink-mute dark:text-neutral-400">
              {subtitle}
            </Text>
          </View>
        </View>
        <Text className="text-xs text-ink-mute dark:text-neutral-400">
          {reachedInPhase}/{total} {expanded ? '▾' : '▸'}
        </Text>
      </Pressable>
      {expanded ? (
        <View className="px-4 pb-3 pt-2">{children}</View>
      ) : null}
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

/** The recovery hero: modular phase boxes that light up as recovery hours grow,
 *  a live smoke-free counter and a live countdown to the next milestone. */
export function HealthTimeline({
  recoveryStartMs,
  setbackHours,
  smokeFreeSinceMs,
  overQuota = false,
}: Props) {
  const { t } = useTranslation();
  const now = useNow(1000);

  const recoveryHours = recoveryHoursFrom(
    (now - recoveryStartMs) / HOUR_MS,
    setbackHours,
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

  // By default only the CURRENT phase is open; manual toggles are remembered
  // per phase. Deriving from `phaseId` avoids a stale set when recovery shifts.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [detailId, setDetailId] = useState<string | null>(null);
  const isExpanded = (id: string): boolean =>
    id in overrides ? overrides[id]! : id === phaseId;
  const toggle = (id: string): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOverrides((o) => ({ ...o, [id]: !isExpanded(id) }));
  };

  const detail = detailId
    ? HEALTH_MILESTONES.find((m) => m.id === detailId)
    : null;

  const countdown = next ? (
    <View className="rounded-xl bg-primary-50 p-3 dark:bg-primary-900">
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
    <Text className="rounded-xl bg-primary-50 p-3 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-100">
      {t('health.allReached')}
    </Text>
  );

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-lg font-bold text-ink dark:text-neutral-50">
            {t('health.title')}
          </Text>
          <Text className="text-xs text-ink-mute dark:text-neutral-400">
            {t('health.sinceLast', { time: formatCountUp(smokeFreeSeconds, t) })}
          </Text>
        </View>
        <View className="rounded-full bg-primary-100 px-3 py-1.5 dark:bg-primary-900">
          <Text className="text-xs font-bold text-primary-700 dark:text-primary-100">
            {t('health.count', { reached, total })}
          </Text>
        </View>
      </View>

      {overQuota ? (
        <Text className="rounded-xl bg-accent-50 p-3 text-xs leading-5 text-accent-700 dark:bg-accent-900 dark:text-accent-100">
          {t('health.setback')}
        </Text>
      ) : null}

      {HEALTH_PHASES.map((phase, i) => {
        const reachedInPhase = phase.milestones.filter(
          (m) => reachedById.get(m.id)?.reached,
        ).length;
        const state: PhaseState =
          i < phaseIndex ? 'done' : i === phaseIndex ? 'current' : 'locked';
        return (
          <PhaseCard
            key={phase.id}
            phaseId={phase.id}
            numeral={ROMAN[i] ?? `${i + 1}`}
            state={state}
            reachedInPhase={reachedInPhase}
            total={phase.milestones.length}
            expanded={isExpanded(phase.id)}
            countdown={state === 'current' ? countdown : undefined}
            onToggle={() => toggle(phase.id)}
          >
            {phase.milestones.map((mst, idx, arr) => {
              const node: NodeState = reachedById.get(mst.id)?.reached
                ? 'reached'
                : mst.id === next?.milestone.id
                  ? 'current'
                  : 'future';
              return (
                <MilestoneRow
                  key={mst.id}
                  id={mst.id}
                  state={node}
                  isLast={idx === arr.length - 1}
                  onPress={() => setDetailId(mst.id)}
                />
              );
            })}
          </PhaseCard>
        );
      })}

      <Text className="text-[11px] leading-4 text-ink-mute dark:text-neutral-400">
        {t('health.disclaimer')}
      </Text>

      {detail ? (
        <DetailModal milestone={detail} onClose={() => setDetailId(null)} />
      ) : null}
    </View>
  );
}
