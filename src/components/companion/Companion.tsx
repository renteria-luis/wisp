import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { colors } from '@/theme/tokens';
import type { VitalityState } from '@/types/domain';

import { characterParts } from './characters';

type Props = {
  vitality: number;
  band: VitalityState;
  /** Companion body color (from the equipped cosmetic). */
  color?: string;
  /** Optional accessory tint (equipped accessory). */
  accessoryColor?: string;
  /** Equipped character id (silhouette). Defaults to the wisp. */
  character?: string;
  size?: number;
};

const INK = colors.ink.DEFAULT;

/** Idle bob period per band — livelier when radiant, sluggish when exhausted. */
const BOB_DURATION: Record<VitalityState, number> = {
  radiant: 1500,
  okay: 2100,
  tired: 2900,
  exhausted: 3800,
};

function Eyes({ band }: { band: VitalityState }) {
  if (band === 'exhausted') {
    return (
      <G stroke={INK} strokeWidth={2.5} strokeLinecap="round" fill="none">
        <Path d="M35 51 Q40 55 45 51" />
        <Path d="M55 51 Q60 55 65 51" />
      </G>
    );
  }
  if (band === 'tired') {
    return (
      <G fill={INK}>
        <Ellipse cx={40} cy={52} rx={3.5} ry={2} />
        <Ellipse cx={60} cy={52} rx={3.5} ry={2} />
      </G>
    );
  }
  const r = band === 'radiant' ? 4.5 : 4;
  return (
    <G fill={INK}>
      <Circle cx={40} cy={51} r={r} />
      <Circle cx={60} cy={51} r={r} />
    </G>
  );
}

function Mouth({ band }: { band: VitalityState }) {
  const d =
    band === 'radiant'
      ? 'M38 67 Q50 80 62 67'
      : band === 'okay'
        ? 'M41 69 Q50 76 59 69'
        : band === 'tired'
          ? 'M43 71 L57 71'
          : 'M41 73 Q50 67 59 73';
  return (
    <Path
      d={d}
      stroke={INK}
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
    />
  );
}

export function Companion({
  vitality,
  band,
  color = colors.primary['400'],
  accessoryColor,
  character,
  size = 180,
}: Props) {
  const reduced = useReducedMotion();
  const bob = useSharedValue(0);
  const parts = characterParts(character);

  useEffect(() => {
    if (reduced) {
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(
      withTiming(1, {
        duration: BOB_DURATION[band],
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    return () => cancelAnimation(bob);
  }, [band, reduced, bob]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * 6 }],
  }));

  const glowOpacity = 0.1 + (Math.max(0, Math.min(100, vitality)) / 100) * 0.3;

  return (
    <Animated.View
      style={animatedStyle}
      accessibilityRole="image"
      accessibilityLabel={`companion-${band}`}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* glow */}
        <Ellipse
          cx={50}
          cy={56}
          rx={42}
          ry={46}
          fill={color}
          opacity={glowOpacity}
        />
        {/* character-specific behind parts (tails, gills, wings) */}
        {parts.behind?.(color)}
        {/* body silhouette (per equipped character) */}
        {parts.body(color)}
        {/* soft belly highlight */}
        <Ellipse
          cx={50}
          cy={64}
          rx={20}
          ry={18}
          fill="#ffffff"
          opacity={0.14}
        />
        {/* accessory (little bow on top) */}
        {accessoryColor ? (
          <G fill={accessoryColor}>
            <Path d="M44 15 L50 19 L44 23 Z" />
            <Path d="M56 15 L50 19 L56 23 Z" />
            <Circle cx={50} cy={19} r={2} />
          </G>
        ) : null}
        {/* radiant cheeks */}
        {band === 'radiant' ? (
          <G fill="#f5934d" opacity={0.5}>
            <Circle cx={33} cy={60} r={3.5} />
            <Circle cx={67} cy={60} r={3.5} />
          </G>
        ) : null}
        <Eyes band={band} />
        <Mouth band={band} />
      </Svg>
    </Animated.View>
  );
}
