import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

import { colors } from '@/theme/tokens';

import { buildLine, type Point } from './path';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  /** Actual cigarettes/day, oldest → newest. */
  actual: number[];
  /** Allowance/target per day, aligned with `actual`. */
  allowances: number[];
  /** Upper bound for the y-axis (e.g. the baseline). */
  max?: number;
  height?: number;
  /** Short date for the first/last point, shown under the x-axis. */
  startLabel?: string;
  endLabel?: string;
};

const PAD_X = 6;
const PAD_T = 12;
const PAD_B = 10;

/**
 * Animated line chart of actual cigarettes vs the daily target — a soft area
 * under the actual line, a dashed target line, and a draw-on stroke. Replaces
 * the Phase-3 placeholder bars.
 */
export function TrendChart({
  actual,
  allowances,
  max,
  height = 132,
  startLabel,
  endLabel,
}: Props) {
  const { t } = useTranslation();
  const [w, setW] = useState(0);
  const reduced = useReducedMotion();
  const draw = useSharedValue(reduced ? 1 : 0);

  const n = actual.length;
  const innerW = Math.max(0, w - PAD_X * 2);
  const innerH = height - PAD_T - PAD_B;
  const yMax = Math.max(1, max ?? 0, ...actual, ...allowances);
  const baseY = PAD_T + innerH;

  const xAt = (i: number): number =>
    PAD_X + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v: number): number => PAD_T + (1 - v / yMax) * innerH;

  const actualPts: Point[] = actual.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const allowPts: Point[] = allowances.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const actualLine = buildLine(actualPts);
  const allowLine = buildLine(allowPts);
  const len = actualLine.length;
  const areaD = `${actualLine.d} L${xAt(n - 1).toFixed(1)} ${baseY.toFixed(
    1,
  )} L${xAt(0).toFixed(1)} ${baseY.toFixed(1)} Z`;

  useEffect(() => {
    if (reduced) {
      draw.value = 1;
      return;
    }
    draw.value = 0;
    draw.value = withTiming(1, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [w, n, reduced, draw]);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: len * (1 - draw.value),
  }));

  const last = actualPts.at(-1);
  const a11yLabel = t('progress.trendA11y', {
    days: n,
    actual: actual.at(-1) ?? 0,
    target: Math.round(allowances.at(-1) ?? 0),
  });

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11yLabel}
    >
      <View
        style={{ height }}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        {w > 0 && n > 0 ? (
          <Svg width={w} height={height}>
            <Defs>
              <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <Stop
                  offset="0"
                  stopColor={colors.primary['400']}
                  stopOpacity={0.24}
                />
                <Stop
                  offset="1"
                  stopColor={colors.primary['400']}
                  stopOpacity={0.02}
                />
              </LinearGradient>
            </Defs>

            {n > 1 ? (
              <>
                {/* soft area under the actual line */}
                <Path d={areaD} fill="url(#trendFill)" />
                {/* dashed target line */}
                <Path
                  d={allowLine.d}
                  stroke={colors.accent['400']}
                  strokeWidth={2}
                  strokeDasharray="2 5"
                  strokeLinecap="round"
                  fill="none"
                  opacity={0.85}
                />
                {/* actual line, drawn on */}
                <AnimatedPath
                  animatedProps={lineProps}
                  d={actualLine.d}
                  stroke={colors.primary['500']}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={len}
                  fill="none"
                />
              </>
            ) : null}

            {/* today marker */}
            {last ? (
              <>
                <Circle
                  cx={last.x}
                  cy={last.y}
                  r={5}
                  fill={colors.primary['600']}
                />
                <Circle
                  cx={last.x}
                  cy={last.y}
                  r={2}
                  fill={colors.neutral['0']}
                />
              </>
            ) : null}
          </Svg>
        ) : null}
      </View>

      {startLabel || endLabel ? (
        <View className="mt-1 flex-row justify-between">
          <Text className="text-[10px] text-ink-mute dark:text-neutral-400">
            {startLabel ?? ''}
          </Text>
          <Text className="text-[10px] text-ink-mute dark:text-neutral-400">
            {endLabel ?? ''}
          </Text>
        </View>
      ) : null}

      <View className="mt-2 flex-row justify-center gap-5">
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-4 rounded-full bg-primary-500" />
          <Text className="text-[11px] text-ink-mute dark:text-neutral-400">
            {t('progress.legendActual')}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="h-0.5 w-4 rounded-full bg-accent-400" />
          <Text className="text-[11px] text-ink-mute dark:text-neutral-400">
            {t('progress.legendTarget')}
          </Text>
        </View>
      </View>
    </View>
  );
}
