import { ConfigContext, ExpoConfig } from 'expo/config';

import brand from './src/personal/brand.json';

const BUNDLE_ID = 'com.luisrenteria.wisp';

/**
 * Dynamic Expo config.
 *
 * The display name (under the home-screen icon, on the splash) comes from
 * `src/personal/brand.json` — a plain JSON so Expo's config loader can resolve
 * it here (it cannot resolve `.ts` imports at config-eval time, which is why the
 * name does not come straight from personal.config). That one JSON is the single
 * brand switch: `personal.appName` reads it too, so the native name and every UI
 * string always agree, and a build for someone else swaps just that file.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: brand.name,
  slug: 'wisp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'wisp',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: BUNDLE_ID,
    // Uses the top-level `icon` — no Icon Composer override.
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#faf6ef',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#faf6ef',
        android: {
          image: './assets/images/splash-icon.png',
          imageWidth: 76,
        },
      },
    ],
    'expo-localization',
    'expo-sqlite',
    'expo-notifications',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
