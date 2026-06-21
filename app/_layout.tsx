import '../src/global.css';
import '@/i18n';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Open the database, load today's counts, and accrue smoke-free coins.
    void (async () => {
      await useLogs.getState().init();
      await useEconomy
        .getState()
        .accrueFromLogs(usePlan.getState().plan?.startDate ?? null);
    })();
  }, []);

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
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
