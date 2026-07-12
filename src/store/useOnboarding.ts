import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  type CurveType,
  DEFAULT_CIGS_PER_PACK,
  DEFAULT_CURRENCY,
  type Gender,
  type Track,
  type TrackPreference,
  type TriggerCategory,
} from '@/types/domain';

/** In-progress onboarding answers. Persisted so a half-finished flow resumes. */
export interface OnboardingDraft {
  name: string;
  cigarettesPerDay: number | null;
  packPrice: number | null;
  cigsPerPack: number;
  currency: string;
  gender: Gender | null;
  age: number | null;
  yearsSmoking: number | null;
  triggers: TriggerCategory[];
  /** Confidence/readiness, 0–10. */
  readiness: number;
  minutesToFirstCigarette: number | null;
  preference: TrackPreference;
  /** Curve shape chosen on the preview (reduction track). */
  curveType: CurveType;
  /** User override of the suggested track, if any. */
  trackOverride: Track | null;
}

interface OnboardingState extends OnboardingDraft {
  patch: (patch: Partial<OnboardingDraft>) => void;
  reset: () => void;
}

const initialDraft: OnboardingDraft = {
  name: '',
  cigarettesPerDay: null,
  packPrice: null,
  cigsPerPack: DEFAULT_CIGS_PER_PACK,
  currency: DEFAULT_CURRENCY,
  gender: null,
  age: null,
  yearsSmoking: null,
  triggers: [],
  readiness: 5,
  minutesToFirstCigarette: null,
  preference: 'unsure',
  curveType: 'linear',
  trackOverride: null,
};

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialDraft,
      patch: (patch) => set(patch),
      reset: () => set({ ...initialDraft }),
    }),
    {
      name: 'wisp-onboarding-draft',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
