import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Length of the check path (M14 26 l6 6 l14 -16) — used to draw it stroke-first. */
const CHECK_LEN = 36;

/**
 * A checkmark that draws itself once: a soft filled circle pops in, then the
 * tick strokes on. Used to confirm a save (check-in, etc.).
 */
export function CheckDraw({
  size = 92,
  color = '#10b981',
}: {
  size?: number;
  color?: string;
}) {
  const ring = useSharedValue(0);
  const tick = useSharedValue(0);

  useEffect(() => {
    ring.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    tick.value = withDelay(
      200,
      withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) }),
    );
  }, [ring, tick]);

  const ringProps = useAnimatedProps(() => ({
    opacity: 0.16 * ring.value,
    r: 22 * (0.6 + 0.4 * ring.value),
  }));
  const tickProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LEN * (1 - tick.value),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 48 48" width={size} height={size}>
        <AnimatedCircle cx={24} cy={24} fill={color} animatedProps={ringProps} />
        <AnimatedPath
          d="M14 26 l6 6 l14 -16"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray={CHECK_LEN}
          animatedProps={tickProps}
        />
      </Svg>
    </View>
  );
}
