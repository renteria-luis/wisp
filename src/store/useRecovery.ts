import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { liveRecoveryHours } from '@/engine/health';

interface RecoveryState {
  /** Timestamp of the last recovery update; null until first seeded. */
  anchorMs: number | null;
  /** Recovery hours at `anchorMs`. Live value = base + time since anchor. */
  baseHours: number;
  /** Seed the anchor (plan start) the first time only. */
  ensureAnchor: (planStartMs: number) => void;
  /** Knock recovery back by `hours` right now (a logged cigarette). */
  penalize: (hours: number) => void;
  reset: () => void;
}

/**
 * The companion's recovery progress as a *running* value: it climbs with real
 * time and each cigarette subtracts a one-time penalty (then it keeps climbing).
 * Floored at zero, never frozen — see `cigarettePenaltyHours` in the engine.
 */
export const useRecovery = create<RecoveryState>()(
  persist(
    (set, get) => ({
      anchorMs: null,
      baseHours: 0,
      ensureAnchor: (planStartMs) => {
        if (get().anchorMs == null) {
          set({ anchorMs: planStartMs, baseHours: 0 });
        }
      },
      penalize: (hours) => {
        const now = Date.now();
        const anchor = get().anchorMs ?? now;
        const live = liveRecoveryHours(get().baseHours, anchor, now);
        set({ baseHours: Math.max(0, live - Math.max(0, hours)), anchorMs: now });
      },
      reset: () => set({ anchorMs: null, baseHours: 0 }),
    }),
    {
      name: 'wisp-recovery',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
