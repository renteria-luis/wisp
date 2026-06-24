import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

const HEARTS = 12;
const DURATION = 1500;

function Heart({ index, reduced }: { index: number; reduced: boolean }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = reduced
      ? 1
      : withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) });
  }, [p, reduced]);

  // Deterministic spread/size per heart so they fan out from the center.
  const dx = ((index * 53) % 120) - 60;
  const size = 16 + ((index * 7) % 18);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [
      { translateY: -p.value * 240 },
      { translateX: dx * p.value },
      { scale: 0.6 + p.value },
    ],
  }));

  return (
    <Animated.Text
      style={[{ position: 'absolute', fontSize: size, color: colors.accent['500'] }, style]}
    >
      ❤
    </Animated.Text>
  );
}

/** A soft burst of floating hearts; calls `onDone` once it finishes. */
export function HeartBurst({
  visible,
  onDone,
}: {
  visible: boolean;
  onDone: () => void;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(onDone, DURATION + 120);
    return () => clearTimeout(id);
  }, [visible, onDone]);

  if (!visible) return null;
  return (
    <View
      pointerEvents="none"
      className="absolute inset-0 items-center justify-center"
    >
      {Array.from({ length: HEARTS }).map((_, i) => (
        <Heart key={i} index={i} reduced={reduced} />
      ))}
    </View>
  );
}
