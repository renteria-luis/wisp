import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useSettings } from '@/store/useSettings';

import { SpeechBubble } from './SpeechBubble';

const PEEK = require('../../../assets/companion/secret/plan_peek.png');
const PEEK_BLINK = require('../../../assets/companion/secret/plan_peek_blink.png');
const ASPECT = 900 / 478;

/**
 * Secret Secret peeking up from the bottom of the Plan screen, with a
 * little love note and a blink every 5s. Only rendered once the secret
 * companion has been unlocked (self-gating, so callers can render it freely).
 */
export function SecretPlanPeek() {
  const unlocked = useSettings((s) => s.secretCompanionUnlocked);
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [blinking, setBlinking] = useState(false);
  const rise = useSharedValue(reduced ? 0 : 1);

  useEffect(() => {
    if (!unlocked) return;
    rise.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [unlocked, rise]);

  useEffect(() => {
    if (!unlocked) return;
    const id = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 180);
    }, 5000);
    return () => clearInterval(id);
  }, [unlocked]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: 1 - rise.value,
    transform: [{ translateY: rise.value * 44 }],
  }));

  if (!unlocked) return null;

  return (
    <View pointerEvents="none" className="items-center">
      <SpeechBubble text={t('plan.secretLove')} />
      <Animated.View
        style={[{ width: '100%', maxWidth: 320 }, riseStyle]}
        accessibilityRole="image"
        accessibilityLabel="Secret"
      >
        <Image
          source={blinking ? PEEK_BLINK : PEEK}
          style={{ width: '100%', aspectRatio: ASPECT }}
          contentFit="contain"
          transition={0}
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </View>
  );
}
