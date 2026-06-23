import { useEffect, useState } from 'react';

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
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import type { VitalityState } from '@/types/domain';
import { daysBetween, todayISO } from '@/utils/date';

const HOUR_MS = 3_600_000;

export interface Vitality {
  score: number;
  band: VitalityState;
}

/** Derives the companion's 0–100 vitality + band from recent logs (§6.4). */
export function useVitality(): Vitality {
  const plan = usePlan((s) => s.plan);
  const todayCigarettes = useLogs((s) => s.todayCigarettes);
  const [vitality, setVitality] = useState<Vitality>({
    score: VITALITY_BASE,
    band: 'okay',
  });

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<Vitality> {
      const now = Date.now();
      const windowStartISO = new Date(
        now - VITALITY_WINDOW_HOURS * HOUR_MS,
      ).toISOString();
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
      return { score, band: vitalityBand(score) };
    }
    load()
      .then((v) => {
        if (!cancelled) setVitality(v);
      })
      .catch(() => {
        /* SQLite unavailable — keep default */
      });
    return () => {
      cancelled = true;
    };
  }, [plan, todayCigarettes]);

  return vitality;
}
