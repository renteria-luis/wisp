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
  Line,
  Path,
  Stop,
} from 'react-native-svg';

import { useThemeColors } from '@/theme/useThemeColors';

import { buildLine, type Point } from './path';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  /** Cumulative money saved per day, oldest → newest. */
  values: number[];
  currency: string;
  /** Short dates for the first/last point, shown under the x-axis. */
  startLabel?: string;
  endLabel?: string;
  height?: number;
};

const PAD_X = 6;
const PAD_T = 14;
const PAD_B = 10;

/**
 * Cumulative savings over the selected range: a soft filled area that climbs to
 * today, with the running total pinned to the last point. Reads as "this money
 * came back to you", which the bare number alone doesn't convey.
 */
export function SavingsChart({
  values,
  currency,
  startLabel,
  endLabel,
  height = 120,
}: Props) {
  const { t } = useTranslation();
  const c = useThemeColors();
  const [w, setW] = useState(0);
  const reduced = useReducedMotion();
  const draw = useSharedValue(reduced ? 1 : 0);

  const n = values.length;
  const innerW = Math.max(0, w - PAD_X * 2);
  const innerH = height - PAD_T - PAD_B;
  const yMax = Math.max(1, ...values);
  const baseY = PAD_T + innerH;

  const xAt = (i: number): number =>
    PAD_X + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v: number): number => PAD_T + (1 - v / yMax) * innerH;

  const pts: Point[] = values.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const line = buildLine(pts);
  const areaD = `${line.d} L${xAt(n - 1).toFixed(1)} ${baseY.toFixed(
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
    strokeDashoffset: line.length * (1 - draw.value),
  }));

  const last = pts.at(-1);
  const total = values.at(-1) ?? 0;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('progress.savedTrendA11y', {
        amount: total.toFixed(2),
        currency,
      })}
    >
      <View
        style={{ height }}
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
      >
        {w > 0 && n > 0 ? (
          <Svg width={w} height={height}>
            <Defs>
              <LinearGradient id="savedFill" x1="0" y1="0" x2="0" y2="1">
                <Stop
                  offset="0"
                  stopColor={c.accent['500']}
                  stopOpacity={0.3}
                />
                <Stop
                  offset="1"
                  stopColor={c.accent['500']}
                  stopOpacity={0.02}
                />
              </LinearGradient>
            </Defs>

            {/* baseline */}
            <Line
              x1={PAD_X}
              y1={baseY}
              x2={w - PAD_X}
              y2={baseY}
              stroke={c.neutral['200']}
              strokeWidth={1}
            />

            {n > 1 ? (
              <>
                <Path d={areaD} fill="url(#savedFill)" />
                <AnimatedPath
                  animatedProps={lineProps}
                  d={line.d}
                  stroke={c.accent['500']}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={line.length}
                  fill="none"
                />
              </>
            ) : null}

            {last ? (
              <>
                <Circle cx={last.x} cy={last.y} r={5} fill={c.accent['500']} />
                <Circle cx={last.x} cy={last.y} r={2} fill={c.neutral['0']} />
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
    </View>
  );
}
