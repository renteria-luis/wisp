import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import {
  HEALTH_MILESTONES,
  milestoneTimeline,
  nextMilestone,
  reachedCount,
} from '@/engine/health';
import { colors } from '@/theme/tokens';

type NodeState = 'reached' | 'current' | 'future';

function Check() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24">
      <Path
        d="M5 13 L10 18 L19 6"
        stroke={colors.neutral['0']}
        strokeWidth={3.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function Node({ state }: { state: NodeState }) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced || state !== 'current') return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [state, reduced, pulse]);

  const ring = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.8 }],
    opacity: 0.45 * (1 - pulse.value),
  }));

  return (
    <View className="h-6 w-6 items-center justify-center">
      {state === 'current' ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              height: 22,
              width: 22,
              borderRadius: 999,
              backgroundColor: colors.accent['400'],
            },
            ring,
          ]}
        />
      ) : null}
      <View
        style={{
          height: 22,
          width: 22,
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
              height: 7,
              width: 7,
              borderRadius: 999,
              backgroundColor: colors.accent['500'],
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

function Row({
  id,
  state,
  isFirst,
  isLast,
}: {
  id: string;
  state: NodeState;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const done = state !== 'future';
  const lineTop = state === 'reached' ? colors.primary['400'] : colors.neutral['200'];
  // the segment below is "done" when the next node is reached/current
  return (
    <View className="flex-row gap-3">
      <View className="w-6 items-center">
        <View
          style={{
            width: 2,
            flex: 1,
            backgroundColor: isFirst ? 'transparent' : lineTop,
          }}
        />
        <Node state={state} />
        <View
          style={{
            width: 2,
            flex: 1,
            backgroundColor: isLast
              ? 'transparent'
              : state === 'reached'
                ? colors.primary['400']
                : colors.neutral['200'],
          }}
        />
      </View>

      <View className="flex-1 pb-5">
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
    </View>
  );
}

function durationLabel(
  t: ReturnType<typeof useTranslation>['t'],
  hours: number,
): string {
  if (hours < 1) return t('health.dur.min', { count: Math.round(hours * 60) });
  if (hours < 48) return t('health.dur.hour', { count: Math.round(hours) });
  return t('health.dur.day', { count: Math.round(hours / 24) });
}

/** The recovery hero: milestones that light up with time SINCE THE LAST cigarette
 *  — it grows while smoke-free and resets when a cigarette is logged. */
export function HealthTimeline({
  elapsedHours,
  overQuota = false,
}: {
  elapsedHours: number;
  overQuota?: boolean;
}) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const timeline = milestoneTimeline(elapsedHours);
  const next = nextMilestone(elapsedHours);
  const reached = reachedCount(elapsedHours);
  const total = HEALTH_MILESTONES.length;
  const currentId = next?.milestone.id;
  const progress = next?.progress ?? 1;

  const [trackW, setTrackW] = useState(0);
  const bar = useSharedValue(0);
  useEffect(() => {
    bar.value = reduced
      ? progress
      : withTiming(progress, { duration: 750, easing: Easing.out(Easing.cubic) });
  }, [progress, reduced, bar]);
  const barStyle = useAnimatedStyle(() => ({
    width: trackW * bar.value,
  }));

  return (
    <View className="rounded-2xl border border-neutral-200 bg-neutral-0 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-ink dark:text-neutral-50">
          {t('health.title')}
        </Text>
        <View className="rounded-full bg-primary-100 px-2.5 py-1">
          <Text className="text-xs font-semibold text-primary-700">
            {t('health.count', { reached, total })}
          </Text>
        </View>
      </View>

      <Text className="mt-1 text-xs text-ink-mute dark:text-neutral-400">
        {t('health.sinceLast', { time: durationLabel(t, elapsedHours) })}
      </Text>

      {overQuota ? (
        <Text className="mt-3 rounded-xl bg-accent-50 p-3 text-xs leading-5 text-accent-700 dark:bg-accent-900 dark:text-accent-100">
          {t('health.setback')}
        </Text>
      ) : null}

      {next ? (
        <View className="mt-3 rounded-xl bg-primary-50 p-3 dark:bg-primary-900">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-xs font-medium text-ink-soft dark:text-neutral-200">
              {t('health.towards', {
                title: t(`health.milestones.${next.milestone.id}.title`),
              })}
            </Text>
            <Text className="text-xs font-bold text-primary-700 dark:text-primary-100">
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View
            className="mt-2 h-2 overflow-hidden rounded-full bg-primary-100"
            onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
          >
            <Animated.View
              style={[
                {
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: colors.primary['500'],
                },
                barStyle,
              ]}
            />
          </View>
        </View>
      ) : (
        <Text className="mt-3 rounded-xl bg-primary-50 p-3 text-sm font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-100">
          {t('health.allReached')}
        </Text>
      )}

      <View className="mt-4">
        {timeline.map((m, i) => (
          <Row
            key={m.milestone.id}
            id={m.milestone.id}
            state={
              m.reached
                ? 'reached'
                : m.milestone.id === currentId
                  ? 'current'
                  : 'future'
            }
            isFirst={i === 0}
            isLast={i === timeline.length - 1}
          />
        ))}
      </View>

      <Text className="text-[11px] leading-4 text-ink-mute dark:text-neutral-400">
        {t('health.disclaimer')}
      </Text>
    </View>
  );
}
