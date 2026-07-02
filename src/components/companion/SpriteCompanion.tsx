import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
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

import { CHARACTER_SPRITES, SPRITE_ACCESSORIES } from './sprites';

type Props = {
  character?: string;
  /** True when the day's smoking has crossed half the quota → sad face. */
  sad?: boolean;
  /** Equipped accessory ids. */
  worn?: string[];
  size?: number;
};

/** True between 11pm and 6am (local) — the companion sleeps (eyes closed). */
function useIsNight(): boolean {
  const isNightNow = (): boolean => {
    const h = new Date().getHours();
    return h >= 23 || h < 6;
  };
  const [night, setNight] = useState(isNightNow);
  useEffect(() => {
    const id = setInterval(() => setNight(isNightNow()), 60_000);
    return () => clearInterval(id);
  }, []);
  return night;
}

/**
 * Illustrated companion: a kawaii creature that breathes, blinks, sleeps at
 * night, and looks sad when the day's smoking passes half the quota. A soft,
 * reactive ground shadow keeps it feeling planted (it shrinks/fades as the
 * creature bobs up). Falls back to the cat for an unknown character.
 *
 * Source images can be any square resolution — they're drawn into a fixed box
 * with `resizeMode="contain"`, and accessories use fractional coordinates, so
 * mixing 1024²/1600²/2048² art "just works".
 */
export function SpriteCompanion({
  character = 'cat',
  sad = false,
  worn = [],
  size = 220,
}: Props) {
  const reduced = useReducedMotion();
  const set = CHARACTER_SPRITES[character] ?? CHARACTER_SPRITES.cat!;
  const night = useIsNight();
  const [blinking, setBlinking] = useState(false);
  const bob = useSharedValue(0);

  // Gentle breathing bob — slower and calmer while asleep.
  useEffect(() => {
    if (reduced) {
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(
      withTiming(1, {
        duration: night ? 4200 : 2200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    return () => cancelAnimation(bob);
  }, [reduced, night, bob]);

  // Random blinks while awake and not sad (eyes open then). Kept independent of
  // "reduce motion" (it's an eye flutter, not vestibular motion) and the gap is
  // capped so there's always at least one blink every ~12s (≤15s guaranteed);
  // back-to-back blinks are fine.
  useEffect(() => {
    if (night || sad) {
      setBlinking(false);
      return;
    }
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (!alive) return;
          setBlinking(true);
          timer = setTimeout(() => {
            if (!alive) return;
            setBlinking(false);
            schedule();
          }, 500);
        },
        1200 + Math.random() * 10000,
      );
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [night, sad]);

  // Priority: asleep (night) → sad → mid-blink → awake & content.
  const sprite = night
    ? set.closed
    : sad
      ? set.sad
      : blinking
        ? set.closed
        : set.base;

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bob.value * (size * 0.03) },
      { scale: 1 + bob.value * 0.01 },
    ],
  }));
  // The shadow shrinks and fades a touch as the creature lifts off the ground.
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.18 - bob.value * 0.06,
    transform: [{ scaleX: 1 - bob.value * 0.12 }],
  }));

  const wornAcc = SPRITE_ACCESSORIES.filter((a) => worn.includes(a.id)).sort(
    (a, b) => a.z - b.z,
  );

  const label = `companion-${character}-${night ? 'sleeping' : sad ? 'sad' : 'happy'}`;

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: size * 0.055,
            left: size * 0.27,
            width: size * 0.46,
            height: size * 0.07,
            borderRadius: 999,
            backgroundColor: '#000000',
          },
          shadowStyle,
        ]}
      />
      <Animated.View
        style={[{ width: size, height: size }, bodyStyle]}
        accessibilityRole="image"
        accessibilityLabel={label}
      >
        <Image
          source={sprite}
          style={{ width: size, height: size }}
          contentFit="contain"
          transition={0}
          cachePolicy="memory-disk"
        />
        {wornAcc.map((a) => {
          const s = size * a.scale;
          return (
            <Image
              key={a.id}
              source={a.art}
              contentFit="contain"
              transition={0}
              cachePolicy="memory-disk"
              style={{
                position: 'absolute',
                width: s,
                height: s,
                left: a.x * size - s / 2,
                top: a.y * size - s / 2,
              }}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}
