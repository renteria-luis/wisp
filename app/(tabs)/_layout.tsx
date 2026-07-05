import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { colors } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

export default function TabsLayout() {
  const { t } = useTranslation();
  const c = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary['600'],
        tabBarInactiveTintColor: colors.ink.mute,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: t('tabs.plan'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Space is disabled — keep the route but hide it from the tab bar. */}
      <Tabs.Screen name="space" options={{ href: null }} />
    </Tabs>
  );
}
