import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { POMPOM } from './secret';

type Props = {
  size?: number;
  /** Bump this (e.g. on tap) to play a random action animation + a squishy pop. */
  actionTrigger?: number;
};

/**
 * The secret Secret companion. Idle "line-boil" cycle (when >1 idle frame),
 * a blink at least once every ~10s, a breathing bob + a gentle constant wobble
 * so the hand-drawn outline feels alive, and a tap reaction (squash-stretch +
 * a random action sequence when action frames exist). expo-image caches frames.
 */
export function SecretCompanion({ size = 220, actionTrigger = 0 }: Props) {
  const reduced = useReducedMotion();
  const [idleIdx, setIdleIdx] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const [action, setAction] = useState<string | null>(null);
  const [actionFrame, setActionFrame] = useState(0);
  const bob = useSharedValue(0);
  const wobble = useSharedValue(0);
  const pop = useSharedValue(0);
  const firstTrigger = useRef(true);

  // Idle boil — cycle the idle variants (no-op while there is only one).
  useEffect(() => {
    if (reduced || POMPOM.idle.length <= 1) return;
    const id = setInterval(
      () => setIdleIdx((i) => (i + 1) % POMPOM.idle.length),
      150,
    );
    return () => clearInterval(id);
  }, [reduced]);

  // Blink — random, guaranteed at least once every ~10s.
  useEffect(() => {
    if (action) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(
        () => {
          if (!alive) return;
          if (POMPOM.blink) {
            setBlinking(true);
            timer = setTimeout(() => {
              if (!alive) return;
              setBlinking(false);
              schedule();
            }, 220);
          } else {
            schedule();
          }
        },
        2500 + Math.random() * 6500,
      );
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [action]);

  // Breathing bob + a tiny constant wobble (a stand-in "tremble" until real boil
  // frames exist).
  useEffect(() => {
    if (reduced) {
      bob.value = 0;
      wobble.value = 0;
      return;
    }
    bob.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    wobble.value = withRepeat(
      withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(bob);
      cancelAnimation(wobble);
    };
  }, [reduced, bob, wobble]);

  // Tap → squishy pop + a random action sequence (if any frames are registered).
  useEffect(() => {
    if (firstTrigger.current) {
      firstTrigger.current = false;
      return;
    }
    pop.value = withSequence(
      withTiming(1, { duration: 110 }),
      withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }),
    );
    void Haptics.selectionAsync();
    const ids = Object.keys(POMPOM.actions);
    if (ids.length === 0) return;
    const pick = ids[Math.floor(Math.random() * ids.length)]!;
    const frames = POMPOM.actions[pick]!;
    setAction(pick);
    setActionFrame(0);
    let f = 0;
    const id = setInterval(() => {
      f += 1;
      if (f >= frames.length) {
        clearInterval(id);
        setAction(null);
        return;
      }
      setActionFrame(f);
    }, 140);
    return () => clearInterval(id);
  }, [actionTrigger, pop]);

  const sprite = action
    ? (POMPOM.actions[action]?.[actionFrame] ?? POMPOM.idle[0])
    : blinking && POMPOM.blink
      ? POMPOM.blink
      : (POMPOM.idle[idleIdx] ?? POMPOM.idle[0]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bob.value * (size * 0.025) },
      { rotate: `${(wobble.value - 0.5) * 0.9}deg` },
      { scaleX: 1 + pop.value * 0.06 },
      { scaleY: 1 - pop.value * 0.06 },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.16 - bob.value * 0.05,
    transform: [{ scaleX: 1 - bob.value * 0.1 }],
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: size * 0.05,
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
        accessibilityLabel="Secret"
      >
        <Image
          source={sprite}
          style={{ width: size, height: size }}
          contentFit="contain"
          transition={0}
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </View>
  );
}
