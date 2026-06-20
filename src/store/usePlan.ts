import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Plan } from '@/types/domain';

interface PlanState {
  /** The active plan, or `null` until onboarding produces one. */
  plan: Plan | null;
  setPlan: (plan: Plan) => void;
  clearPlan: () => void;
}

export const usePlan = create<PlanState>()(
  persist(
    (set) => ({
      plan: null,
      setPlan: (plan) => set({ plan }),
      clearPlan: () => set({ plan: null }),
    }),
    {
      name: 'wisp-plan',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
