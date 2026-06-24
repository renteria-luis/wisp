import '../src/global.css';

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { applyLanguage } from '@/i18n';
import {
  configureNotificationHandler,
  rescheduleTriggerNotifications,
} from '@/notifications/scheduler';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      applyLanguage(useSettings.getState().language);
      await useLogs.getState().init();
      await useEconomy
        .getState()
        .accrueFromLogs(usePlan.getState().plan?.startDate ?? null);
      await configureNotificationHandler();
      const s = useSettings.getState();
      await rescheduleTriggerNotifications(
        s.triggers,
        s.quietHours,
        s.notificationsEnabled,
      );
    })();
  }, []);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider
          value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="log" options={{ presentation: 'modal' }} />
            <Stack.Screen name="craving" options={{ presentation: 'modal' }} />
            <Stack.Screen name="about" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
            <Stack.Screen name="godmode" options={{ presentation: 'modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
