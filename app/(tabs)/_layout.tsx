import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationEventMap,
  type MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import type { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';
import { ChartLineUp, House, MapTrifold } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '@/theme/tokens';
import { useThemeColors } from '@/theme/useThemeColors';

// Swipeable tabs: a material top-tab navigator pinned to the BOTTOM, so the
// three screens can be dragged left/right while keeping a bottom bar.
const { Navigator } = createMaterialTopTabNavigator();
const SwipeTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabsLayout() {
  const { t } = useTranslation();
  const c = useThemeColors();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const barBg = isDark ? c.neutral['900'] : c.neutral['0'];

  return (
    <SwipeTabs
      tabBarPosition="bottom"
      screenOptions={{
        tabBarActiveTintColor: c.primary['600'],
        tabBarInactiveTintColor: colors.ink.mute,
        tabBarShowIcon: true,
        tabBarShowLabel: true,
        tabBarPressColor: 'transparent',
        tabBarLabelStyle: {
          fontFamily: 'Changa_500Medium',
          fontSize: 11,
          textTransform: 'none',
          marginTop: 1,
        },
        tabBarIndicatorStyle: {
          top: 0,
          height: 3,
          borderRadius: 3,
          backgroundColor: c.primary['500'],
        },
        tabBarStyle: {
          backgroundColor: barBg,
          height: 54 + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: isDark ? c.neutral['800'] : c.neutral['200'],
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <SwipeTabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <House color={color} size={25} weight={focused ? 'duotone' : 'regular'} />
          ),
        }}
      />
      <SwipeTabs.Screen
        name="plan"
        options={{
          title: t('tabs.plan'),
          tabBarIcon: ({ color, focused }) => (
            <MapTrifold
              color={color}
              size={25}
              weight={focused ? 'duotone' : 'regular'}
            />
          ),
        }}
      />
      <SwipeTabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ color, focused }) => (
            <ChartLineUp
              color={color}
              size={25}
              weight={focused ? 'duotone' : 'regular'}
            />
          ),
        }}
      />
    </SwipeTabs>
  );
}
