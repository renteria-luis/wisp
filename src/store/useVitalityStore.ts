import { create } from 'zustand';

import {
  getLastCigaretteTimestamp,
  healthWeightedCountSince,
} from '@/data/repositories/cigaretteLog';
import { allowanceForDay } from '@/engine/planEngine';
import {
  computeVitality,
  VITALITY_BASE,
  VITALITY_WINDOW_HOURS,
  vitalityBand,
} from '@/engine/vitality';
import type { Plan, VitalityState } from '@/types/domain';
import { daysBetween, nowISO, todayISO } from '@/utils/date';
import { logDev } from '@/utils/logger';

const HOUR_MS = 3_600_000;

interface VitalityStore {
  score: number;
  band: VitalityState;
  /**
   * Recompute the companion's vitality from the latest logs. Keeps the previous
   * value on failure so the companion never flashes back to a default — and,
   * crucially, it can be `await`ed once at startup so the right mood is on
   * screen the moment the splash hides (no 0→real flash).
   */
  recompute: (plan: Plan | null) => Promise<void>;
}

export const useVitalityStore = create<VitalityStore>((set) => ({
  score: VITALITY_BASE,
  band: 'okay',
  recompute: async (plan) => {
    try {
      const now = Date.now();
      const windowStartISO = nowISO(
        new Date(now - VITALITY_WINDOW_HOURS * HOUR_MS),
      );
      const [recentCigarettes, lastCig] = await Promise.all([
        healthWeightedCountSince(windowStartISO),
        getLastCigaretteTimestamp(),
      ]);
      const hoursSinceLastCigarette = lastCig
        ? (now - new Date(lastCig).getTime()) / HOUR_MS
        : VITALITY_WINDOW_HOURS;
      const dailyTarget = plan
        ? allowanceForDay(
            plan,
            Math.max(0, daysBetween(plan.startDate, todayISO())),
          )
        : 0;
      const recentTarget = dailyTarget * (VITALITY_WINDOW_HOURS / 24);
      const score = computeVitality({
        recentCigarettes,
        recentTarget,
        hoursSinceLastCigarette,
      });
      set({ score, band: vitalityBand(score) });
    } catch (err) {
      logDev('store/useVitalityStore', err);
      /* SQLite unavailable (e.g. web prerender) — keep the previous value */
    }
  },
}));
