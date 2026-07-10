import '../src/global.css';

import {
  Changa_400Regular,
  Changa_500Medium,
  Changa_600SemiBold,
  Changa_700Bold,
  useFonts,
} from '@expo-google-fonts/changa';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { vars } from 'nativewind';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { applyLanguage } from '@/i18n';
import {
  configureNotificationHandler,
  rescheduleTriggerNotifications,
} from '@/notifications/scheduler';
import { useCompanion } from '@/store/useCompanion';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useRecovery } from '@/store/useRecovery';
import { useSettings } from '@/store/useSettings';
import { useVitalityStore } from '@/store/useVitalityStore';
import { useWishlist } from '@/store/useWishlist';
import { applySavedTheme } from '@/theme/appearance';
import { applyFontDefault } from '@/theme/fontDefault';
import { defaultVarsInput, pinkVarsInput } from '@/theme/themes';

applyFontDefault();

// The class-palette variable scope is applied ALWAYS (default values normally,
// pink values for the Pink theme) so switching only changes values — never
// inserts/removes the scope, which would remount the navigator and crash.
const PINK_VARS = vars(pinkVarsInput());
const LIGHT_VARS = vars(defaultVarsInput());

// Keep the native splash up until the first frame can show real data instead of
// store defaults (the "everything flashes from 0 for a second" problem).
SplashScreen.preventAutoHideAsync().catch(() => {});

type Hydratable = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (cb: () => void) => () => void;
  };
};

/** Resolves once a persisted Zustand store has finished loading from disk. */
function whenHydrated(store: Hydratable): Promise<void> {
  if (store.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = store.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const theme = useSettings((s) => s.theme);
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Changa_400Regular,
    Changa_500Medium,
    Changa_600SemiBold,
    Changa_700Bold,
  });

  useEffect(() => {
    let cancelled = false;
    // Safety net: never keep the splash up longer than this, even if a load stalls.
    const safety = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 4000);

    void (async () => {
      try {
        // 1. Wait for persisted stores to load from disk (plan, settings, …).
        await Promise.all([
          whenHydrated(useSettings),
          whenHydrated(usePlan),
          whenHydrated(useEconomy),
          whenHydrated(useCompanion),
          whenHydrated(useRecovery),
          whenHydrated(useWishlist),
        ]);
        // 2. Apply saved appearance + language before the first frame.
        applySavedTheme();
        applyLanguage(useSettings.getState().language);
        // 3. Load today's counts from SQLite.
        await useLogs.getState().init();
        // 4. Seed recovery, accrue coins, precompute the companion's vitality.
        const plan = usePlan.getState().plan;
        if (plan) {
          useRecovery.getState().ensureAnchor();
        }
        await useEconomy.getState().accrueFromLogs(plan);
        await useVitalityStore.getState().recompute(plan);
        // 5. Notifications (best effort, never blocks the reveal).
        await configureNotificationHandler();
        const s = useSettings.getState();
        await rescheduleTriggerNotifications(
          s.triggers,
          s.quietHours,
          s.notificationsEnabled,
        );
      } catch {
        /* best effort — reveal the app regardless */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, []);

  // Hide the splash the moment everything above (and the font) is loaded.
  useEffect(() => {
    if (ready && fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [ready, fontsLoaded]);

  useEffect(() => {
    let sub: { remove: () => void } | undefined;
    void (async () => {
      try {
        const N = await import('expo-notifications');
        sub = N.addNotificationResponseReceivedListener((response) => {
          const url = response.notification.request.content.data?.url;
          if (url === '/craving') router.push('/craving');
        });
      } catch {
        /* notifications unavailable */
      }
    })();
    return () => sub?.remove();
  }, [router]);

  // While not ready the native splash covers the screen, so render nothing —
  // this avoids mounting the app with default data and flashing it.
  if (!ready || !fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[{ flex: 1 }, theme === 'pink' ? PINK_VARS : LIGHT_VARS]}>
        <SafeAreaProvider>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              animationDuration: 260,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="log" options={{ presentation: 'modal' }} />
            <Stack.Screen
              name="manual-log"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="craving"
              options={{
                // A transparent screen so the craving sheet can be a custom,
                // JS-gesture-driven half-sheet: the drag directly drives the
                // Home companion's lift so it tracks the finger 1:1 (a native
                // sheet never exposes the in-progress drag). Home stays mounted
                // and visible behind it to coach the user.
                presentation: 'transparentModal',
                animation: 'none',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="checkin" options={{ presentation: 'modal' }} />
            <Stack.Screen name="wishlist" options={{ presentation: 'modal' }} />
            <Stack.Screen name="ebooks" options={{ presentation: 'modal' }} />
            <Stack.Screen name="about" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
            <Stack.Screen name="godmode" options={{ presentation: 'modal' }} />
          </Stack>
          <CelebrationOverlay />
          <StatusBar style="auto" />
        </ThemeProvider>
        </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
