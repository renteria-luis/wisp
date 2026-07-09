import { useEffect, useState } from 'react';

import { getDailyCigaretteCounts } from '@/data/repositories/cigaretteLog';
import { allowanceForDay } from '@/engine/planEngine';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
import { addDaysISO, daysBetween, todayISO } from '@/utils/date';

/**
 * How many recent past days the plan expected some smoking (allowance > 0) yet
 * have zero logs — a hint the user forgot to log. Returns 0 while loading, when
 * there's no plan, or once the gap has been reviewed. `dismiss` marks the gap
 * reviewed up to yesterday so it isn't asked about again.
 */
export function useMissedDays(): { count: number; dismiss: () => void } {
  const plan = usePlan((s) => s.plan);
  const reviewedUntil = useSettings((s) => s.missedReviewedUntil);
  const setReviewed = useSettings((s) => s.setMissedReviewedUntil);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!plan) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const yesterday = addDaysISO(todayISO(), -1);
    const start = reviewedUntil
      ? addDaysISO(reviewedUntil, 1)
      : plan.startDate;
    if (start > yesterday) {
      setCount(0);
      return;
    }
    void (async () => {
      try {
        const rows = await getDailyCigaretteCounts(start, yesterday);
        const byDay = new Map(rows.map((r) => [r.date, r.count]));
        let missed = 0;
        let d = start;
        while (d <= yesterday) {
          const idx = Math.max(0, daysBetween(plan.startDate, d));
          if (allowanceForDay(plan, idx) > 0 && (byDay.get(d) ?? 0) === 0) {
            missed += 1;
          }
          d = addDaysISO(d, 1);
        }
        if (!cancelled) setCount(missed);
      } catch {
        if (!cancelled) setCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plan, reviewedUntil]);

  const dismiss = (): void => {
    setReviewed(addDaysISO(todayISO(), -1));
    setCount(0);
  };

  return { count, dismiss };
}
