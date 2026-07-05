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

import { PP_ACTIONS, PP_ASPECT, PP_FRAMES, type PPFrame } from './secret';

type Props = {
  /** Rendered height in px; width follows the frame aspect. */
  size?: number;
  /** Over 80% of the daily quota: PP is sad and only bounces when tapped. */
  sad?: boolean;
  /** Bump this (e.g. on tap) to bounce + maybe play a random action. */
  actionTrigger?: number;
};

type Mode = 'idle' | 'sit' | 'busy';

const NIGHT_START = 23;
const NIGHT_END = 6;
const isNightNow = () => {
  const h = new Date().getHours();
  return h >= NIGHT_START || h < NIGHT_END;
};

/**
 * The secret Secret companion. Idle standing with random blinks and the
 * occasional lean / sit-down; sleeps (eyes closed) at night; sad frame when the
 * quota is blown. Tapping always bounces (any state); when idle & not sad it
 * plays — 25% just the bounce, otherwise an even split of eat-cookie / show-
 * hamster / show-pancake. Frames are locked to a shared canvas so PP never
 * jumps; expo-image caches them.
 */
export function SecretCompanion({
  size = 232,
  sad = false,
  actionTrigger = 0,
}: Props) {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState<PPFrame>('base');
  const [mode, setModeState] = useState<Mode>('idle');
  const [night, setNight] = useState(isNightNow);

  const modeRef = useRef<Mode>('idle');
  const sadRef = useRef(sad);
  const nightRef = useRef(night);
  const frameRef = useRef<PPFrame>('base');
  const actionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const firstTrigger = useRef(true);

  const bob = useSharedValue(0);
  const pop = useSharedValue(0);

  const setMode = (m: Mode) => {
    modeRef.current = m;
    setModeState(m);
  };
  useEffect(() => {
    sadRef.current = sad;
  }, [sad]);
  useEffect(() => {
    nightRef.current = night;
    frameRef.current = frame;
  }, [night, frame]);

  // Re-check night roughly every 5 min so PP falls asleep / wakes on its own.
  useEffect(() => {
    const id = setInterval(() => setNight(isNightNow()), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const clearActionTimers = () => {
    actionTimers.current.forEach(clearTimeout);
    actionTimers.current = [];
  };
  useEffect(() => clearActionTimers, []);

  const playAction = (id: keyof typeof PP_ACTIONS) => {
    clearActionTimers();
    setMode('busy');
    let t = 0;
    for (const [fk, ms] of PP_ACTIONS[id]) {
      actionTimers.current.push(setTimeout(() => setFrame(fk), t));
      t += ms;
    }
    actionTimers.current.push(setTimeout(() => setMode('idle'), t));
  };

  // Idle behaviour: blink loop + slow ambient (lean or sit). Re-runs whenever
  // the mode/sad/night context changes; a busy sequence drives its own frames.
  useEffect(() => {
    if (night) {
      setFrame('blink'); // sleeping
      return;
    }
    if (sad) {
      setFrame('sad');
      return;
    }
    if (mode === 'sit') {
      setFrame('sit');
      return;
    }
    if (mode !== 'idle') return;
    setFrame('base');
    if (reduced) return;

    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const fromBase = () => alive && frameRef.current === 'base';

    const blink = () => {
      timers.push(
        setTimeout(
          () => {
            if (!alive) return;
            if (!fromBase()) return blink();
            setFrame('blink');
            timers.push(
              setTimeout(() => {
                if (!alive) return;
                setFrame('base');
                blink();
              }, 170),
            );
          },
          2500 + Math.random() * 6500,
        ),
      );
    };
    const ambient = () => {
      timers.push(
        setTimeout(
          () => {
            if (!alive) return;
            if (!fromBase()) return ambient();
            if (Math.random() < 0.55) {
              setFrame('inclined');
              timers.push(
                setTimeout(() => {
                  if (!alive) return;
                  setFrame('base');
                  ambient();
                }, 640),
              );
            } else {
              alive = false;
              setMode('sit'); // sit down and stay until tapped
            }
          },
          10000 + Math.random() * 9000,
        ),
      );
    };
    blink();
    ambient();
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [mode, sad, night, reduced]);

  // Tap: always a squishy bounce; then maybe an action.
  useEffect(() => {
    if (firstTrigger.current) {
      firstTrigger.current = false;
      return;
    }
    pop.value = withSequence(
      withTiming(1, { duration: 110 }),
      withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );
    void Haptics.selectionAsync();

    if (sadRef.current || nightRef.current) return; // bounce only
    const m = modeRef.current;
    if (m === 'busy') return; // don't interrupt a running action
    if (m === 'sit') {
      setMode('idle'); // stand back up
      return;
    }
    const r = Math.random();
    if (r < 0.25) {
      if (Math.random() < 0.4) playAction('lean');
      return;
    }
    if (r < 0.5) playAction('cookie');
    else if (r < 0.75) playAction('hamster');
    else playAction('pancake');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionTrigger]);

  // Gentle breathing bob.
  useEffect(() => {
    if (reduced) {
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(bob);
  }, [reduced, bob]);

  const H = size;
  const W = Math.round(size * PP_ASPECT);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -bob.value * (H * 0.02) },
      { scaleX: 1 + pop.value * 0.05 },
      { scaleY: 1 - pop.value * 0.05 },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: 0.16 - bob.value * 0.05,
    transform: [{ scaleX: 1 - bob.value * 0.1 }],
  }));

  return (
    <View style={{ width: W, height: H }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            bottom: H * 0.02,
            alignSelf: 'center',
            width: W * 0.42,
            height: H * 0.05,
            borderRadius: 999,
            backgroundColor: '#000000',
          },
          shadowStyle,
        ]}
      />
      <Animated.View
        style={[{ width: W, height: H }, bodyStyle]}
        accessibilityRole="image"
        accessibilityLabel="Secret"
      >
        <Image
          source={PP_FRAMES[frame]}
          style={{ width: W, height: H }}
          contentFit="contain"
          transition={60}
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </View>
  );
}
