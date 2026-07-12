import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SupportedLanguage } from '@/i18n';
import { personal } from '@/personal/personal.config';
import {
  DEFAULT_CIGS_PER_PACK,
  DEFAULT_CURRENCY,
  type Pricing,
  type Profile,
  type QuietHours,
  type TriggerCategory,
} from '@/types/domain';

/** Span shown by the Progress trend chart. */
export type TrendRange = 'week' | 'month' | 'all';

interface SettingsState {
  profile: Profile;
  pricing: Pricing;
  /** Baseline cigarettes/day captured at onboarding. */
  cigarettesPerDay: number;
  /** The user's name, used for greetings. */
  userName: string;
  companionName: string;
  /** `null` follows the device locale. */
  language: SupportedLanguage | null;
  /** Monetization scaffold (PROJECT.md §13) — forced open in our builds. */
  isPremium: boolean;
  onboardingCompleted: boolean;
  triggers: TriggerCategory[];
  /** Notifications-suppressed window; null = always allow. */
  quietHours: QuietHours | null;
  /** Whether local trigger notifications are scheduled (permission granted). */
  notificationsEnabled: boolean;
  /** ISO until which situational "I'm out" support is active; null = off. */
  situationalUntil: string | null;
  /** Ids of one-time easter eggs already revealed (so they don't repeat). */
  seenEggs: string[];
  /** Appearance preference; `system` follows the device. */
  theme: 'system' | 'light' | 'dark' | 'pink';
  /** ISO date the morning greeting was last shown (so it shows once a day). */
  lastMorningGreet: string | null;
  /** Secret Secret companion, unlocked via a hidden tap in onboarding. */
  secretCompanionUnlocked: boolean;
  /** ISO date up to which missed-log days have been reviewed (so we don't
   *  keep asking about the same gap). */
  missedReviewedUntil: string | null;
  /** Span shown by the Progress trend chart (week / month / all-time). */
  trendRange: TrendRange;
  /** The post-onboarding guided tour has been seen (or skipped). */
  tutorialCompleted: boolean;
  /** Haptic feedback (the app's only "sound"). Some people can't stand it, and
   *  it is the one channel that fires on almost every tap — so it gets a
   *  switch. See utils/feedback. */
  hapticsEnabled: boolean;

  setProfile: (patch: Partial<Profile>) => void;
  setPricing: (patch: Partial<Pricing>) => void;
  setBaseline: (cigarettesPerDay: number) => void;
  setUserName: (name: string) => void;
  setCompanionName: (name: string) => void;
  setLanguage: (language: SupportedLanguage | null) => void;
  setTriggers: (triggers: TriggerCategory[]) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setQuietHours: (quietHours: QuietHours | null) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setSituationalUntil: (iso: string | null) => void;
  markEggSeen: (id: string) => void;
  setTheme: (theme: 'system' | 'light' | 'dark' | 'pink') => void;
  setLastMorningGreet: (iso: string | null) => void;
  setSecretCompanionUnlocked: (unlocked: boolean) => void;
  setMissedReviewedUntil: (iso: string | null) => void;
  setTrendRange: (range: TrendRange) => void;
  setTutorialCompleted: (completed: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  reset: () => void;
}

const initialState = {
  profile: {} as Profile,
  pricing: {
    packPrice: 0,
    cigsPerPack: DEFAULT_CIGS_PER_PACK,
    currency: DEFAULT_CURRENCY,
  } satisfies Pricing,
  cigarettesPerDay: 0,
  userName: '',
  companionName: personal.companionDefaultName,
  language: null as SupportedLanguage | null,
  isPremium: true,
  onboardingCompleted: false,
  triggers: [] as TriggerCategory[],
  quietHours: {
    start: { hour: 22, minute: 0 },
    end: { hour: 7, minute: 0 },
  } as QuietHours | null,
  notificationsEnabled: false,
  situationalUntil: null as string | null,
  seenEggs: [] as string[],
  theme: 'system' as 'system' | 'light' | 'dark' | 'pink',
  lastMorningGreet: null as string | null,
  secretCompanionUnlocked: false,
  missedReviewedUntil: null as string | null,
  trendRange: 'week' as TrendRange,
  tutorialCompleted: false,
  hapticsEnabled: true,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
      setPricing: (patch) =>
        set((s) => ({ pricing: { ...s.pricing, ...patch } })),
      setBaseline: (cigarettesPerDay) => set({ cigarettesPerDay }),
      setUserName: (userName) => set({ userName }),
      setCompanionName: (companionName) => set({ companionName }),
      setLanguage: (language) => set({ language }),
      setTriggers: (triggers) => set({ triggers }),
      setOnboardingCompleted: (onboardingCompleted) =>
        set({ onboardingCompleted }),
      setQuietHours: (quietHours) => set({ quietHours }),
      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),
      setSituationalUntil: (situationalUntil) => set({ situationalUntil }),
      markEggSeen: (id) =>
        set((s) => (s.seenEggs.includes(id) ? s : { seenEggs: [...s.seenEggs, id] })),
      setTheme: (theme) => set({ theme }),
      setLastMorningGreet: (lastMorningGreet) => set({ lastMorningGreet }),
      setSecretCompanionUnlocked: (secretCompanionUnlocked) =>
        set({ secretCompanionUnlocked }),
      setMissedReviewedUntil: (missedReviewedUntil) =>
        set({ missedReviewedUntil }),
      setTrendRange: (trendRange) => set({ trendRange }),
      setTutorialCompleted: (tutorialCompleted) => set({ tutorialCompleted }),
      setHapticsEnabled: (hapticsEnabled) => set({ hapticsEnabled }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'wisp-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
