import { ConfigContext, ExpoConfig } from 'expo/config';

const BUNDLE_ID = 'com.luisrenteria.wisp';

/**
 * Dynamic Expo config.
 *
 * NOTE: the native display name is intentionally inlined here rather than
 * imported from `src/personal/personal.config.ts`. Expo's config loader
 * transpiles only this file, so it cannot resolve relative `.ts` imports at
 * config-eval time. Keep this `name` in sync with `personal.appName`
 * (the runtime/UI source of truth). See PROGRESS.md.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Wisp',
  slug: 'wisp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'wisp',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: BUNDLE_ID,
    icon: './assets/expo.icon',
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
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
