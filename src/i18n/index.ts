/**
 * i18n setup (PROJECT.md §10). English default, Spanish available.
 * Device locale is detected via expo-localization; a manual override is wired
 * in settings in a later phase. All user-facing strings live in locale JSON.
 */
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
  // eslint-disable-next-line import/no-named-as-default-member
  i18n.use(initReactI18next).init({
    resources,
    lng: detectDeviceLanguage(),
    fallbackLng: defaultLanguage,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
}

/** Apply a language override, or follow the device locale when `null`. */
export function applyLanguage(language: SupportedLanguage | null): void {
  // eslint-disable-next-line import/no-named-as-default-member
  void i18n.changeLanguage(language ?? detectDeviceLanguage());
}

export default i18n;
