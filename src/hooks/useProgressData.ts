import { useEffect, useMemo, useState } from 'react';

import {
  getDailyCigaretteCounts,
  getDailyPaidCigaretteCounts,
} from '@/data/repositories/cigaretteLog';
import {
  countWinDays,
  currentTrend,
  currentWinStreak,
  recommendReplan,
  type ReplanRecommendation,
} from '@/engine/adherence';
import { cigarettesAvoided, moneySaved, savingsSeries } from '@/engine/savings';
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
  /** Cumulative money saved per day — powers the savings sparkline. */
  savedSeries: number[];
  recommendation: ReplanRecommendation;
}

/** Reads the logs for the active plan's span and derives all progress metrics. */
export function useProgressData(): ProgressData {
  const plan = usePlan((s) => s.plan);
  const pricing = useSettings((s) => s.pricing);
  // Today's count changes whenever a log is added — use it as a refetch trigger.
  const todayCigarettes = useLogs((s) => s.todayCigarettes);
  const [actual, setActual] = useState<number[]>([]);
  // Paid-only daily counts (gifted excluded) — drive money saved / cigs avoided.
  const [paidActual, setPaidActual] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<{ all: number[]; paid: number[] }> {
      if (!plan) return { all: [], paid: [] };
      const today = todayISO();
      const [allRows, paidRows] = await Promise.all([
        getDailyCigaretteCounts(plan.startDate, today),
        getDailyPaidCigaretteCounts(plan.startDate, today),
      ]);
      const dense = (rows: typeof allRows): number[] =>
        densifyDailyCounts(rows, plan.startDate, today).map((d) => d.count);
      return { all: dense(allRows), paid: dense(paidRows) };
    }
    load()
      .then(({ all, paid }) => {
        if (!cancelled) {
          setActual(all);
          setPaidActual(paid);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActual([]);
          setPaidActual([]);
        }
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
      avoided: cigarettesAvoided(baseline, paidActual),
      saved: moneySaved({
        baseline,
        actualDaily: paidActual,
        packPrice: pricing.packPrice,
        cigsPerPack: pricing.cigsPerPack,
      }),
      savedSeries: savingsSeries({
        baseline,
        actualDaily: paidActual,
        packPrice: pricing.packPrice,
        cigsPerPack: pricing.cigsPerPack,
      }),
      recommendation: recommendReplan({ actual, allowances }),
    };
  }, [plan, actual, paidActual, pricing.packPrice, pricing.cigsPerPack]);
}
