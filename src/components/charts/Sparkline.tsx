import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '@/theme/tokens';

import { buildLine, type Point } from './path';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  /** Series (e.g. cumulative savings), oldest → newest. */
  values: number[];
  height?: number;
  color?: string;
};

const PAD = 3;

/** Tiny draw-on area line for a single trend — no axes, meant to sit in a card. */
export function Sparkline({
  values,
  height = 44,
  color = colors.accent['500'],
}: Props) {
  const [w, setW] = useState(0);
  const reduced = useReducedMotion();
  const draw = useSharedValue(reduced ? 1 : 0);

  const n = values.length;
  const innerW = Math.max(0, w - PAD * 2);
  const innerH = height - PAD * 2;
  const yMax = Math.max(1, ...values);
  const yMin = Math.min(0, ...values);
  const span = Math.max(1, yMax - yMin);

  const xAt = (i: number): number =>
    PAD + (n <= 1 ? innerW : (i / (n - 1)) * innerW);
  const yAt = (v: number): number => PAD + (1 - (v - yMin) / span) * innerH;

  const pts: Point[] = values.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  const { d, length } = buildLine(pts);
  const baseY = height - PAD;
  const areaD = `${d} L${xAt(n - 1).toFixed(1)} ${baseY.toFixed(1)} L${xAt(
    0,
  ).toFixed(1)} ${baseY.toFixed(1)} Z`;

  useEffect(() => {
    if (reduced) {
      draw.value = 1;
      return;
    }
    draw.value = 0;
    draw.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [w, n, reduced, draw]);

  const lineProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - draw.value),
  }));

  return (
    <View style={{ height }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && n > 1 ? (
        <Svg width={w} height={height}>
          <Defs>
            <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.22} />
              <Stop offset="1" stopColor={color} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          <Path d={areaD} fill="url(#sparkFill)" />
          <AnimatedPath
            animatedProps={lineProps}
            d={d}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={length}
            fill="none"
          />
        </Svg>
      ) : null}
    </View>
  );
}
