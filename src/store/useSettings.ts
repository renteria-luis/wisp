import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SupportedLanguage } from '@/i18n';
import { personal } from '@/personal/personal.config';
import type { Pricing, Profile, TriggerCategory } from '@/types/domain';

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

  setProfile: (patch: Partial<Profile>) => void;
  setPricing: (patch: Partial<Pricing>) => void;
  setBaseline: (cigarettesPerDay: number) => void;
  setUserName: (name: string) => void;
  setCompanionName: (name: string) => void;
  setLanguage: (language: SupportedLanguage | null) => void;
  setTriggers: (triggers: TriggerCategory[]) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  reset: () => void;
}

const initialState = {
  profile: {} as Profile,
  pricing: { packPrice: 0, cigsPerPack: 20, currency: 'USD' } satisfies Pricing,
  cigarettesPerDay: 0,
  userName: '',
  companionName: personal.companionDefaultName,
  language: null as SupportedLanguage | null,
  isPremium: true,
  onboardingCompleted: false,
  triggers: [] as TriggerCategory[],
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
      reset: () => set({ ...initialState }),
    }),
    {
      name: 'wisp-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
