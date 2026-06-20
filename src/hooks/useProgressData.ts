import { useEffect, useMemo, useState } from 'react';

import { getDailyCigaretteCounts } from '@/data/repositories/cigaretteLog';
import {
  countWinDays,
  currentTrend,
  currentWinStreak,
  recommendReplan,
  type ReplanRecommendation,
} from '@/engine/adherence';
import { cigarettesAvoided, moneySaved } from '@/engine/savings';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
import { todayISO } from '@/utils/date';
import { densifyDailyCounts } from '@/utils/series';

export interface ProgressData {
  hasPlan: boolean;
  /** Dense actual cigarettes/day from plan start → today. */
  actual: number[];
  allowances: number[];
  trend: number;
  winDayCount: number;
  streak: number;
  smokeFreeDays: number;
  totalCigarettes: number;
  avoided: number;
  saved: number;
  recommendation: ReplanRecommendation;
}

/** Reads the logs for the active plan's span and derives all progress metrics. */
export function useProgressData(): ProgressData {
  const plan = usePlan((s) => s.plan);
  const pricing = useSettings((s) => s.pricing);
  // Today's count changes whenever a log is added — use it as a refetch trigger.
  const todayCigarettes = useLogs((s) => s.todayCigarettes);
  const [actual, setActual] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<number[]> {
      if (!plan) return [];
      const today = todayISO();
      const rows = await getDailyCigaretteCounts(plan.startDate, today);
      return densifyDailyCounts(rows, plan.startDate, today).map(
        (d) => d.count,
      );
    }
    load()
      .then((counts) => {
        if (!cancelled) setActual(counts);
      })
      .catch(() => {
        if (!cancelled) setActual([]);
      });
    return () => {
      cancelled = true;
    };
  }, [plan, todayCigarettes]);

  return useMemo(() => {
    const allowances = plan ? plan.allowances.slice(0, actual.length) : [];
    const baseline = plan?.baseline ?? 0;
    return {
      hasPlan: !!plan,
      actual,
      allowances,
      trend: currentTrend(actual),
      winDayCount: countWinDays(actual, allowances),
      streak: currentWinStreak(actual, allowances),
      smokeFreeDays: actual.filter((n) => n === 0).length,
      totalCigarettes: actual.reduce((s, n) => s + n, 0),
      avoided: cigarettesAvoided(baseline, actual),
      saved: moneySaved({
        baseline,
        actualDaily: actual,
        packPrice: pricing.packPrice,
        cigsPerPack: pricing.cigsPerPack,
      }),
      recommendation: recommendReplan({ actual, allowances }),
    };
  }, [plan, actual, pricing.packPrice, pricing.cigsPerPack]);
}
