import { useEffect } from 'react';

import { useLogs } from '@/store/useLogs';
import { usePlan } from '@/store/usePlan';
import { useVitalityStore } from '@/store/useVitalityStore';
import type { VitalityState } from '@/types/domain';

export interface Vitality {
  score: number;
  band: VitalityState;
}

/**
 * Subscribes to the shared vitality value and keeps it fresh as the plan or
 * today's count change. The value lives in `useVitalityStore`, which is
 * precomputed once during the root bootstrap — so the companion shows the right
 * mood on the first painted frame instead of flashing up from a default (§6.4).
 */
export function useVitality(): Vitality {
  const plan = usePlan((s) => s.plan);
  const todayCigarettes = useLogs((s) => s.todayCigarettes);
  const score = useVitalityStore((s) => s.score);
  const band = useVitalityStore((s) => s.band);
  const recompute = useVitalityStore((s) => s.recompute);

  useEffect(() => {
    void recompute(plan);
  }, [plan, todayCigarettes, recompute]);

  return { score, band };
}
