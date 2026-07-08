import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * A soft breathing pulse — two concentric circles that swell and settle in a
 * calm rhythm. Shown for a beat after resisting a craving.
 */
export function BreathePulse({
  size = 132,
  color = '#10b981',
}: {
  size?: number;
  color?: string;
}) {
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withRepeat(
      withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [s]);

  const halo = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + s.value * 0.4 }],
    opacity: 0.1 + s.value * 0.14,
  }));
  const core = useAnimatedStyle(() => ({
    transform: [{ scale: 0.72 + s.value * 0.28 }],
    opacity: 0.55 + s.value * 0.3,
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          halo,
        ]}
      />
      <Animated.View
        style={[
          {
            width: size * 0.46,
            height: size * 0.46,
            borderRadius: size * 0.23,
            backgroundColor: color,
          },
          core,
        ]}
      />
    </View>
  );
}
