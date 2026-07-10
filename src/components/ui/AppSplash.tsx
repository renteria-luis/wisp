import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { WispCircle } from '@/components/companion/WispCircle';

const PP_HEAD = require('../../../assets/companion/secret/plan_peek.png');

// Matches the native splash background (app.config `expo-splash-screen`), so the
// hand-off from the native splash to this JS one is seamless — no black gap.
const SPLASH_BG = '#faf6ef';

type Props = {
  /** Load finished — fade the splash out and reveal the app underneath. */
  done: boolean;
  /** Whether the secret companion is unlocked; `null` until settings hydrate,
   *  so the logo only appears once we know which one to show. */
  unlocked: boolean | null;
  /** Called after the fade-out completes so the parent can unmount this. */
  onHidden: () => void;
};

/**
 * A gentle in-app loading screen shown while the stores hydrate on a cold start
 * (or after the OS has killed a backgrounded app). It covers the native →
 * JS-first-frame hand-off so the launch feels smooth instead of flashing black,
 * then cross-fades to reveal the app. A warm resume never re-mounts this.
 */
export function AppSplash({ done, unlocked, onHidden }: Props) {
  const opacity = useSharedValue(1);
  const logo = useSharedValue(0);
  const hidNative = useRef(false);

  // Hand off from the native splash the moment this one is on screen.
  const hideNative = (): void => {
    if (hidNative.current) return;
    hidNative.current = true;
    SplashScreen.hideAsync().catch(() => {});
  };

  // Fade the logo in once we know which one to show (after settings hydrate).
  useEffect(() => {
    if (unlocked !== null) {
      logo.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
    }
  }, [unlocked, logo]);

  // Fade the whole splash out when loading finishes, then unmount.
  useEffect(() => {
    if (!done) return;
    opacity.value = withTiming(
      0,
      { duration: 380, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(onHidden)();
      },
    );
  }, [done, opacity, onHidden]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: 0.92 + logo.value * 0.08 }],
  }));

  return (
    <Animated.View
      pointerEvents={done ? 'none' : 'auto'}
      onLayout={hideNative}
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: SPLASH_BG,
          alignItems: 'center',
          justifyContent: 'center',
        },
        rootStyle,
      ]}
    >
      <Animated.View style={logoStyle}>
        {unlocked === true ? (
          <Image
            source={PP_HEAD}
            style={{ width: 168, height: 168 }}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        ) : unlocked === false ? (
          <WispCircle size={132} />
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}
