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

import { useCompanion } from '@/store/useCompanion';
import { tap } from '@/utils/feedback';

import {
  PP_ACTIONS,
  PP_ASPECT,
  PP_FRAMES,
  type PPActionId,
  type PPFrame,
} from './secret';

type Props = {
  /** Rendered height in px; width follows the frame aspect. */
  size?: number;
  /** Over 80% of the daily quota: PP is sad and only bounces when tapped. */
  sad?: boolean;
  /** Bump this (e.g. on tap) to bounce + maybe play a random action. */
  actionTrigger?: number;
  /** While the craving sheet is open: stand up and close the eyes (breathe
   *  along), without touching the saved posture — so PP returns to whatever it
   *  was doing once the sheet closes. */
  cravingActive?: boolean;
  /** While true, keep the eyes closed (held press) and pause auto-blinking. */
  holdClose?: boolean;
};

type Posture = 'stand' | 'sit';

const NIGHT_START = 23;
const NIGHT_END = 6;
const isNightNow = () => {
  const h = new Date().getHours();
  return h >= NIGHT_START || h < NIGHT_END;
};

/** How long PP stands (sad / idle) before it sits down on its own. */
const SIT_AFTER_MS = 10_000;

/**
 * The secret Secret companion. Idle standing with random blinks and the
 * occasional lean / sit-down; sits and nibbles a cookie, shows the hamster or
 * pancakes, or turns around to wave; sleeps at night; sad (and eventually
 * sad-sitting) past 80% of the quota. Tapping always bounces in any state, but
 * plays at most one action per 10s. Frames are locked to a shared canvas so PP
 * never jumps; expo-image caches them.
 */
export function SecretCompanion({
  size = 248,
  sad = false,
  actionTrigger = 0,
  cravingActive = false,
  holdClose = false,
}: Props) {
  const reduced = useReducedMotion();
  // Posture is persisted so PP stays sitting/standing across app restarts.
  const savedPosture = useCompanion.getState().secretPosture;
  const [frame, setFrame] = useState<PPFrame>('base');
  const [posture, setPostureState] = useState<Posture>(savedPosture);
  const [busy, setBusyState] = useState(false);
  const [night, setNight] = useState(isNightNow);
  // Bumped on every tap; resets the "sit down after a while" idle timer.
  const [poke, setPoke] = useState(0);

  const postureRef = useRef<Posture>(savedPosture);
  const busyRef = useRef(false);
  const sadRef = useRef(sad);
  const nightRef = useRef(night);
  const frameRef = useRef<PPFrame>('base');
  const actionTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const firstTrigger = useRef(true);
  const moodInit = useRef(true);

  const bob = useSharedValue(0);
  const pop = useSharedValue(0);

  const setPosture = (p: Posture) => {
    postureRef.current = p;
    setPostureState(p);
    useCompanion.getState().setSecretPosture(p);
  };
  const setBusy = (b: boolean) => {
    busyRef.current = b;
    setBusyState(b);
  };
  useEffect(() => {
    sadRef.current = sad;
  }, [sad]);
  useEffect(() => {
    nightRef.current = night;
    frameRef.current = frame;
  }, [night, frame]);

  // When mood context flips, straighten up — but not on the first mount, so a
  // persisted sitting posture is restored when the app reopens.
  useEffect(() => {
    if (moodInit.current) {
      moodInit.current = false;
      return;
    }
    setPosture('stand');
  }, [sad, night]);

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

  const runAction = (id: PPActionId) => {
    const action = PP_ACTIONS[id];
    clearActionTimers();
    setBusy(true);
    let t = 0;
    for (const [fk, ms] of action.steps) {
      actionTimers.current.push(setTimeout(() => setFrame(fk), t));
      t += ms;
    }
    actionTimers.current.push(
      setTimeout(() => {
        setPosture(action.end);
        setBusy(false);
      }, t),
    );
  };

  // Idle behaviour. Re-runs on any context change; a busy sequence owns its own
  // frames so this bails while busy.
  useEffect(() => {
    if (busy) return;
    if (cravingActive) {
      // Craving sheet open: stand up and shut the eyes to breathe along. Posture
      // is left untouched, so PP resumes its prior state once the sheet closes.
      setFrame('blink');
      return;
    }
    if (holdClose && !sad) {
      // Held press: keep the eyes shut (closed frame for the current posture).
      // Never while sad — a sad PP keeps its eyes open when you press it.
      setFrame(posture === 'sit' ? 'sit_blink' : 'blink');
      return;
    }
    if (night) {
      // Asleep: eyes closed (sit_blink when curled up, blink when standing).
      if (posture === 'sit') setFrame('sit_blink');
      else setFrame('blink');
      return;
    }
    if (sad) {
      if (posture === 'sit') {
        setFrame('sit_sad');
        return;
      }
      setFrame('sad');
      if (reduced) return;
      const id = setTimeout(() => setPosture('sit'), SIT_AFTER_MS);
      return () => clearTimeout(id);
    }

    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const stop = () => {
      alive = false;
      timers.forEach(clearTimeout);
    };

    if (posture === 'sit') {
      setFrame('sit');
      if (reduced) return;
      const blink = () => {
        timers.push(
          setTimeout(
            () => {
              if (!alive) return;
              if (frameRef.current !== 'sit') return blink();
              setFrame('sit_blink');
              timers.push(
                setTimeout(() => {
                  if (!alive) return;
                  setFrame('sit');
                  blink();
                }, 170),
              );
            },
            2800 + Math.random() * 6000,
          ),
        );
      };
      blink();
      return stop;
    }

    // Standing, normal.
    setFrame('base');
    if (reduced) return;
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
    blink();
    // Sit down on its own after ~10s without a tap (any tap bumps `poke`,
    // which re-runs this effect and restarts the timer).
    timers.push(
      setTimeout(() => {
        if (alive) setPosture('sit');
      }, SIT_AFTER_MS),
    );
    return stop;
  }, [busy, posture, sad, night, cravingActive, holdClose, reduced, poke]);

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
    tap();
    setPoke((p) => p + 1); // reset the idle "sit down" timer

    // A new action can start only once the previous one has finished (busy),
    // and only from an idle posture — then each keeps its own probability.
    if (busyRef.current) return; // bounce only mid-action
    if (nightRef.current) {
      // Asleep: a tap can make it curl up and sit (still asleep) — never stand.
      if (postureRef.current === 'stand') setPosture('sit');
      return;
    }

    if (sadRef.current) {
      // Sad: never acts; only a small chance to get up from sad-sitting.
      if (postureRef.current === 'sit' && Math.random() < 0.1) setPosture('stand');
      return;
    }

    if (postureRef.current === 'sit') {
      const r = Math.random();
      if (r < 0.25) {
        setPosture('stand'); // 25% stand up
      } else if (r < 0.5) {
        runAction('cookieSit'); // 25% eat a cookie
      }
      return; // otherwise just the bounce
    }

    // Standing.
    const r = Math.random();
    if (r < 0.25) {
      if (Math.random() < 0.4) runAction('lean');
      return;
    }
    const pool: PPActionId[] = ['cookieStand', 'hamster', 'pancake', 'giro'];
    let pick = pool[Math.floor(Math.random() * pool.length)]!;
    // Eating a cookie: 50% of the time PP stays seated instead of standing up.
    if (pick === 'cookieStand' && Math.random() < 0.5) pick = 'cookieStandStay';
    runAction(pick);
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
            width: W * 0.46,
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
