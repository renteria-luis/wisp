import { useEffect, useState } from 'react';
import { Image } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { VitalityState } from '@/types/domain';

import { CHARACTER_SPRITES, SPRITE_ACCESSORIES } from './sprites';

type Props = {
  band: VitalityState;
  character?: string;
  /** Equipped accessory ids. */
  worn?: string[];
  size?: number;
};

/** Idle bob period per band — livelier when radiant, sluggish when exhausted. */
const BOB_DURATION: Record<VitalityState, number> = {
  radiant: 1500,
  okay: 2100,
  tired: 2900,
  exhausted: 3800,
};

/** Illustrated companion: a vitality-driven sprite that breathes, blinks, and
 *  wears equipped accessories. Falls back to the cat if the character is unknown. */
export function SpriteCompanion({
  band,
  character = 'cat',
  worn = [],
  size = 220,
}: Props) {
  const reduced = useReducedMotion();
  const set = CHARACTER_SPRITES[character] ?? CHARACTER_SPRITES.cat!;
  const bob = useSharedValue(0);
  const [blinking, setBlinking] = useState(false);

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

  // Occasional blink — only when the eyes are open (okay / radiant).
  useEffect(() => {
    const canBlink = !reduced && !!set.blink && (band === 'okay' || band === 'radiant');
    if (!canBlink) {
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
          }, 130);
        },
        2500 + Math.random() * 3500,
      );
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [band, reduced, set.blink]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -bob.value * 6 }, { scale: 1 + bob.value * 0.012 }],
  }));

  const sprite = blinking && set.blink ? set.blink : set.base[band];
  const wornAcc = SPRITE_ACCESSORIES.filter((a) => worn.includes(a.id)).sort(
    (a, b) => a.z - b.z,
  );

  return (
    <Animated.View
      style={[{ width: size, height: size }, animatedStyle]}
      accessibilityRole="image"
      accessibilityLabel={`companion-${band}`}
    >
      <Image
        source={sprite}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {wornAcc.map((a) => {
        const s = size * a.scale;
        return (
          <Image
            key={a.id}
            source={a.art}
            resizeMode="contain"
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
  );
}
