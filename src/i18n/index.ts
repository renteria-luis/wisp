/**
 * i18n setup (PROJECT.md §10). English default, Spanish available.
 * Device locale is detected via expo-localization; a manual override is wired
 * in settings in a later phase. All user-facing strings live in locale JSON.
 */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { personal } from '@/personal/personal.config';
import { setDateLocale } from '@/utils/date';

import en from './locales/en.json';
import es from './locales/es.json';

export const supportedLanguages = ['en', 'es'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
export const defaultLanguage: SupportedLanguage = 'en';

export const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

function detectDeviceLanguage(): SupportedLanguage {
  const code = getLocales()[0]?.languageCode;
  return code && (supportedLanguages as readonly string[]).includes(code)
    ? (code as SupportedLanguage)
    : defaultLanguage;
}

if (!i18n.isInitialized) {
  const initial = detectDeviceLanguage();
  setDateLocale(initial);
  // eslint-disable-next-line import/no-named-as-default-member
  i18n.use(initReactI18next).init({
    resources,
    lng: initial,
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false,
      // `{{appName}}` resolves in every string without threading the name
      // through each `t()` call — so the whole UI is branded from one place,
      // and a build for someone else changes only brand.json.
      defaultVariables: { appName: personal.appName },
    },
    returnNull: false,
  });
}

/** Apply a language override, or follow the device locale when `null`. Dates go
 *  with it — otherwise the copy is Spanish and the dates are still English. */
export function applyLanguage(language: SupportedLanguage | null): void {
  const lng = language ?? detectDeviceLanguage();
  setDateLocale(lng);
  // eslint-disable-next-line import/no-named-as-default-member
  void i18n.changeLanguage(lng);
}

export default i18n;
