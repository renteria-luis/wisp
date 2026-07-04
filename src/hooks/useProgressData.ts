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
import { liveRecoveryHours } from '@/engine/health';
import { cigarettesAvoided, moneySaved, savingsSeries } from '@/engine/savings';
import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useRecovery } from '@/store/useRecovery';
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
  /** Anchor (ms) for the live smoke-free count-up: last cigarette, or plan start. */
  smokeFreeSinceMs: number;
  /** Anchor (ms) for the running recovery value (last update). */
  recoveryAnchorMs: number;
  /** Recovery hours at the anchor; live value = base + time since anchor. */
  recoveryBaseHours: number;
  /** Snapshot of live recovery hours right now (≥ 0). */
  recoveryHours: number;
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
  const recAnchor = useRecovery((s) => s.anchorMs);
  const recBase = useRecovery((s) => s.baseHours);
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
    // Running recovery: stored base + time since the anchor. The anchor is
    // seeded to "now" on first launch (recovery starts at 0), so a brand-new
    // account shows 0 — not a head start from the plan's UTC-parsed calendar date.
    const recoveryAnchorMs = recAnchor ?? Date.now();
    const recoveryBaseHours = recBase;
    const recoveryHours = liveRecoveryHours(
      recoveryBaseHours,
      recoveryAnchorMs,
      Date.now(),
    );
    // Smoke-free since the last cigarette, or the journey anchor if none logged.
    const smokeFreeSinceMs = lastCigaretteAt
      ? new Date(lastCigaretteAt).getTime()
      : recoveryAnchorMs;
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
      smokeFreeSinceMs,
      recoveryAnchorMs,
      recoveryBaseHours,
      recoveryHours,
      overQuota: trend > todayAllowance + 0.001,
      recommendation: recommendReplan({ actual, allowances }),
    };
  }, [
    plan,
    actual,
    paidActual,
    lastCigaretteAt,
    recAnchor,
    recBase,
    pricing.packPrice,
    pricing.cigsPerPack,
  ]);
}
