import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useSettings } from '@/store/useSettings';

const PEEK = require('../../../assets/companion/secret/plan_peek.png');
const PEEK_BLINK = require('../../../assets/companion/secret/plan_peek_blink.png');
const ASPECT = 900 / 478;

/**
 * Secret Secret peeking up from the bottom of the Plan screen, blinking at
 * a random 2–5s cadence, with a small hand-written love note tucked into the
 * bottom-right corner. Only rendered once the secret companion is unlocked.
 */
export function SecretPlanPeek() {
  const unlocked = useSettings((s) => s.secretCompanionUnlocked);
  const reduced = useReducedMotion();
  const [blinking, setBlinking] = useState(false);
  const [held, setHeld] = useState(false);
  const rise = useSharedValue(reduced ? 0 : 1);

  useEffect(() => {
    if (!unlocked) return;
    rise.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [unlocked, rise]);

  // Blink at a random 2–5s cadence — paused while held (eyes stay shut).
  useEffect(() => {
    if (!unlocked || held) return;
    let alive = true;
    let openTimer: ReturnType<typeof setTimeout>;
    let closeTimer: ReturnType<typeof setTimeout>;
    const loop = () => {
      openTimer = setTimeout(
        () => {
          if (!alive) return;
          setBlinking(true);
          closeTimer = setTimeout(() => {
            if (!alive) return;
            setBlinking(false);
            loop();
          }, 180);
        },
        2000 + Math.random() * 3000,
      );
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
    };
  }, [unlocked, held]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: 1 - rise.value,
    transform: [{ translateY: rise.value * 44 }],
  }));

  if (!unlocked) return null;

  return (
    <View className="w-full items-center">
      <Animated.View style={[{ width: '100%', maxWidth: 300 }, riseStyle]}>
        <Pressable
          onPressIn={() => setHeld(true)}
          onPressOut={() => setHeld(false)}
          accessibilityRole="image"
          accessibilityLabel="companion"
        >
          <Image
            source={held || blinking ? PEEK_BLINK : PEEK}
            style={{ width: '100%', aspectRatio: ASPECT }}
            contentFit="contain"
            transition={0}
            cachePolicy="memory-disk"
          />
        </Pressable>
      </Animated.View>
      <Text
        pointerEvents="none"
        className="absolute bottom-3 right-3 text-right text-xs leading-4 text-ink-mute dark:text-neutral-400"
      >
        made{'\n'}with <Text className="text-accent-500">♥</Text>
        {'\n'}for Tiffani
      </Text>
    </View>
  );
}
