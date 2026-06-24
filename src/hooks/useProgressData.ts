import { useEffect, useMemo, useState } from 'react';

import {
  getDailyCigaretteCounts,
  getDailyPaidCigaretteCounts,
  getLastCigaretteTimestamp,
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
  /** Hours since the last logged cigarette (or plan start if none). Drives the
   *  recovery timeline: grows while smoke-free, resets to ~0 on a new log. */
  smokeFreeHours: number;
  /** True when the 7-day trend is above today's allowance (gentle setback). */
  overQuota: boolean;
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
  // ISO of the most recent cigarette — anchors the recovery timeline.
  const [lastCigaretteAt, setLastCigaretteAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<{
      all: number[];
      paid: number[];
      last: string | null;
    }> {
      if (!plan) return { all: [], paid: [], last: null };
      const today = todayISO();
      const [allRows, paidRows, last] = await Promise.all([
        getDailyCigaretteCounts(plan.startDate, today),
        getDailyPaidCigaretteCounts(plan.startDate, today),
        getLastCigaretteTimestamp(),
      ]);
      const dense = (rows: typeof allRows): number[] =>
        densifyDailyCounts(rows, plan.startDate, today).map((d) => d.count);
      return { all: dense(allRows), paid: dense(paidRows), last };
    }
    load()
      .then(({ all, paid, last }) => {
        if (!cancelled) {
          setActual(all);
          setPaidActual(paid);
          setLastCigaretteAt(last);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActual([]);
          setPaidActual([]);
          setLastCigaretteAt(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [plan, todayCigarettes]);

  return useMemo(() => {
    const allowances = plan ? plan.allowances.slice(0, actual.length) : [];
    const baseline = plan?.baseline ?? 0;
    const anchorMs = lastCigaretteAt
      ? new Date(lastCigaretteAt).getTime()
      : plan
        ? new Date(plan.startDate).getTime()
        : Date.now();
    const smokeFreeHours = Math.max(0, (Date.now() - anchorMs) / 3_600_000);
    const trend = currentTrend(actual);
    const todayAllowance = allowances.length
      ? (allowances[allowances.length - 1] ?? 0)
      : baseline;
    return {
      hasPlan: !!plan,
      actual,
      allowances,
      trend,
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
      smokeFreeHours,
      overQuota: trend > todayAllowance + 0.001,
      recommendation: recommendReplan({ actual, allowances }),
    };
  }, [
    plan,
    actual,
    paidActual,
    lastCigaretteAt,
    pricing.packPrice,
    pricing.cigsPerPack,
  ]);
}
