import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useCelebration } from '@/store/useCelebration';
import { colors } from '@/theme/tokens';

const CONFETTI = ['✨', '⭐', '💫', '🎊', '🌟', '✨'];
const HOLD_MS = 1900;

/** A single confetti emoji that drifts down and fades while a celebration plays. */
function ConfettiPiece({
  emoji,
  x,
  delay,
  play,
}: {
  emoji: string;
  x: number;
  delay: number;
  play: boolean;
}) {
  const ty = useSharedValue(0);
  const op = useSharedValue(0);
  useEffect(() => {
    if (!play) {
      ty.value = 0;
      op.value = 0;
      return;
    }
    op.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(700, withTiming(0, { duration: 600 })),
      ),
    );
    ty.value = withDelay(
      delay,
      withTiming(96, { duration: 1300, easing: Easing.in(Easing.quad) }),
    );
  }, [play, delay, ty, op]);
  const style = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));
  return (
    <Animated.Text
      style={[{ position: 'absolute', top: -12, left: x, fontSize: 20 }, style]}
    >
      {emoji}
    </Animated.Text>
  );
}

/**
 * Global celebration overlay: a tasteful, auto-dismissing burst for the app's
 * little wins (a new health milestone, a wishlist treat, beating a craving).
 * Mounted once in the root layout; driven by `useCelebration`.
 *
 * It is a plain absolutely-positioned view (NOT a Modal) with
 * `pointerEvents="none"`, so it can never intercept touches or interfere with
 * the navigator / react-native-screens — it just paints on top for ~2s.
 */
export function CelebrationOverlay() {
  const current = useCelebration((s) => s.current);
  const dismiss = useCelebration((s) => s.dismiss);
  const reduced = useReducedMotion();
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!current) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (reduced) {
      scale.value = 1;
      opacity.value = 1;
    } else {
      opacity.value = withTiming(1, { duration: 160 });
      scale.value = withSequence(
        withTiming(1.05, { duration: 220, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 140 }),
      );
    }
    const hide = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 220 });
    }, HOLD_MS);
    const clear = setTimeout(() => {
      dismiss();
      scale.value = 0.6;
      opacity.value = 0;
    }, HOLD_MS + 260);
    return () => {
      clearTimeout(hide);
      clearTimeout(clear);
    };
  }, [current, dismiss, reduced, scale, opacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!current) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.cardWrap, cardStyle]}>
        {!reduced
          ? CONFETTI.map((e, i) => (
              <ConfettiPiece
                key={i}
                emoji={e}
                x={20 + i * 32}
                delay={i * 80}
                play={!!current}
              />
            ))
          : null}
        <LinearGradient
          colors={[colors.accent['400'], colors.accent['600']]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.emoji}>{current.emoji}</Text>
          <Text style={styles.message}>{current.message}</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 9999,
    elevation: 9999,
  },
  cardWrap: { width: '100%', maxWidth: 320 },
  card: {
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emoji: { fontSize: 44 },
  message: {
    marginTop: 8,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
});
