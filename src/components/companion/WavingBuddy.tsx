import { Image } from 'expo-image';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CHARACTER_SPRITES, characterForToday } from './sprites';

/**
 * A companion waving hello — a gentle side-to-side tilt of today's character.
 * Handy for warm empty states.
 */
export function WavingBuddy({ size = 128 }: { size?: number }) {
  const wave = useSharedValue(0);
  useEffect(() => {
    wave.value = withRepeat(
      withTiming(1, { duration: 620, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [wave]);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(wave.value - 0.5) * 14}deg` }],
  }));

  const src = CHARACTER_SPRITES[characterForToday()]?.base;
  if (!src) return null;

  return (
    <Animated.View style={style}>
      <Image
        source={src}
        style={{ width: size, height: size }}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
}
