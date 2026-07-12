import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useThemeColors } from '@/theme/useThemeColors';
import { tap } from '@/utils/feedback';

type Props = {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  /** Snap increment (0.1 → one decimal). */
  step?: number;
};

const THUMB = 30;
const TRACK_H = 10;

/** The iOS picker-style tick as the value crosses a whole number. */
function tick(): void {
  tap();
}

/**
 * A draggable 0–10 slider with one decimal. The thumb follows the finger on the
 * UI thread (a shared value drives it) and only the snapped value crosses back
 * to JS, so dragging stays smooth. Tapping anywhere on the track jumps to it.
 *
 * NOTE: everything inside the gesture handlers is a worklet — keep it to plain
 * arithmetic (`Math.*`). `Number()` / `.toFixed()` are NOT available in the
 * worklet runtime and crash the app.
 */
export function Slider({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.1,
}: Props) {
  const c = useThemeColors();
  // Width lives in a shared value, not React state — this component holds no
  // state at all, so a layout pass can never queue an update into it.
  const trackW = useSharedValue(0);
  const pos = useSharedValue(0);
  // Last whole number crossed, so the haptic ticks like a picker (not 100×).
  const lastWhole = useSharedValue(-1);

  // Follow the value when it changes from outside a drag (mount, reset, …).
  const pct = max > min ? (value - min) / (max - min) : 0;
  useEffect(() => {
    pos.value = Math.min(1, Math.max(0, pct));
  }, [pct, pos]);

  const drag = (x: number): void => {
    'worklet';
    const tw = trackW.value;
    if (tw <= 0) return;
    const p = Math.min(Math.max(x - THUMB / 2, 0), tw) / tw;
    pos.value = p;
    const raw = min + p * (max - min);
    const whole = Math.round(raw);
    if (whole !== lastWhole.value) {
      lastWhole.value = whole;
      runOnJS(tick)();
    }
    const snapped = Math.round(raw / step) * step;
    runOnJS(onChange)(Math.round(snapped * 10) / 10);
  };

  const pan = Gesture.Pan()
    .onBegin((e) => drag(e.x))
    .onUpdate((e) => drag(e.x));

  const fillStyle = useAnimatedStyle(() => ({
    width: pos.value * trackW.value,
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * trackW.value }],
  }));

  return (
    <View>
      <Text className="mb-3 text-center text-4xl font-bold text-primary-600">
        {value.toFixed(1)}
      </Text>

      <GestureDetector gesture={pan}>
        <View
          onLayout={(e) => {
            trackW.value = Math.max(0, e.nativeEvent.layout.width - THUMB);
          }}
          accessibilityRole="adjustable"
          // `now`/`min`/`max` cross into a native integer (NSInteger) — handing
          // them a decimal throws "Loss of precision during arithmetic
          // conversion" and takes the screen down. The exact value goes through
          // `text`, which is what a screen reader announces anyway.
          accessibilityValue={{
            min: Math.round(min),
            max: Math.round(max),
            now: Math.round(value),
            text: value.toFixed(1),
          }}
          style={{ height: 44, justifyContent: 'center' }}
        >
          <View
            style={{
              height: TRACK_H,
              marginHorizontal: THUMB / 2,
              borderRadius: 999,
              backgroundColor: c.neutral['200'],
            }}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: THUMB / 2,
                height: TRACK_H,
                borderRadius: 999,
                backgroundColor: c.primary['500'],
              },
              fillStyle,
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: 'absolute',
                left: 0,
                width: THUMB,
                height: THUMB,
                borderRadius: THUMB / 2,
                backgroundColor: c.neutral['0'],
                borderWidth: 3,
                borderColor: c.primary['500'],
                shadowColor: '#000',
                shadowOpacity: 0.18,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: 4,
              },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}
