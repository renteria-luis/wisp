import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { liveRecoveryHours } from '@/engine/health';

interface RecoveryState {
  /** Timestamp of the last recovery update; null until first seeded. */
  anchorMs: number | null;
  /** Recovery hours at `anchorMs`. Live value = base + time since anchor. */
  baseHours: number;
  /** High-water mark of milestones already celebrated (−1 = uninitialized). */
  seenMilestones: number;
  /** Seed the anchor to NOW the first time only (recovery starts at 0 and
   *  climbs). Must be the real instant — NOT the plan's calendar date, which
   *  parsed as UTC midnight gave new accounts a many-hour head start. */
  ensureAnchor: () => void;
  /** Knock recovery back by `hours` right now (a logged cigarette). */
  penalize: (hours: number) => void;
  /** Dev/God-mode: move recovery forward by `days` (may be negative). */
  advance: (days: number) => void;
  /** Record how many milestones the user has now seen celebrated. */
  setSeenMilestones: (n: number) => void;
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
      seenMilestones: -1,
      ensureAnchor: () => {
        if (get().anchorMs == null) {
          set({ anchorMs: Date.now(), baseHours: 0 });
        }
      },
      penalize: (hours) => {
        const now = Date.now();
        const anchor = get().anchorMs ?? now;
        const live = liveRecoveryHours(get().baseHours, anchor, now);
        set({ baseHours: Math.max(0, live - Math.max(0, hours)), anchorMs: now });
      },
      // Advancing forward `days` = moving the anchor into the past so the live
      // value (base + now − anchor) grows by that many days.
      advance: (days) =>
        set((s) => ({
          anchorMs: (s.anchorMs ?? Date.now()) - days * 86_400_000,
        })),
      setSeenMilestones: (n) => set({ seenMilestones: n }),
      reset: () => set({ anchorMs: null, baseHours: 0, seenMilestones: -1 }),
    }),
    {
      name: 'wisp-recovery',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);
