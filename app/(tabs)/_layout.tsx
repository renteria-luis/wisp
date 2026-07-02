import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { colors } from '@/theme/tokens';

/** Space is disabled for now — shown but locked (a little padlock, dimmed). */
function LockedSpaceIcon({ size }: { size: number }) {
  return (
    <View style={{ width: size, height: size, opacity: 0.5 }}>
      <Ionicons name="sparkles-outline" color={colors.ink.mute} size={size} />
      <View style={{ position: 'absolute', right: -5, bottom: -3 }}>
        <Ionicons name="lock-closed" color={colors.ink.mute} size={size * 0.62} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary['600'],
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
      <Tabs.Screen
        name="space"
        options={{
          title: t('tabs.space'),
          tabBarIcon: ({ size }) => <LockedSpaceIcon size={size} />,
        }}
        listeners={{
          // Locked: tapping it does nothing until Space is re-enabled.
          tabPress: (e) => e.preventDefault(),
        }}
      />
    </Tabs>
  );
}
