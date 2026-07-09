import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useThemeColors } from '@/theme/useThemeColors';

/**
 * The default assistant before the secret companion is unlocked: the soft wisp
 * circle from onboarding, breathing gently. Tap it (handled by the parent) to
 * pick a character.
 */
export function WispCircle({ size = 200 }: { size?: number }) {
  const c = useThemeColors();
  const reduced = useReducedMotion();
  const breath = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      breath.value = 0;
      return;
    }
    breath.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(breath);
  }, [reduced, breath]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.05 }],
  }));

  const inner = size * 0.56;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: c.primary['100'],
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
        accessibilityRole="image"
        accessibilityLabel="wisp"
      >
        <View
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: c.primary['400'],
          }}
        />
      </Animated.View>
    </View>
  );
}
