import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  COACH_LINES,
  MORNING_LINES,
  QUOTA_LINES,
  SLEEPING_LINES,
  pickLine,
  type Lang,
  type QuotaBand,
} from '@/content/companionLines';
import { useCoach } from '@/store/useCoach';

type Opts = {
  band: QuotaBand;
  night: boolean;
  /** True while the once-a-day morning greeting should show. */
  morning: boolean;
  name: string;
};

/**
 * The line the companion "says" right now. Priority: craving-coaching context
 * (while the toolkit is open) → night (sleeping) → morning greeting → the quota
 * band. Re-picks on mount, when any of those change, and every ~25–40s.
 */
export function useCompanionLine({ band, night, morning, name }: Opts): string {
  const { i18n } = useTranslation();
  const lang: Lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const coach = useCoach((s) => s.context);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setTick((n) => n + 1),
      25000 + Math.random() * 15000,
    );
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    const set = coach
      ? COACH_LINES[coach][lang]
      : night
        ? SLEEPING_LINES[lang]
        : morning
          ? MORNING_LINES[lang]
          : QUOTA_LINES[band][lang];
    return pickLine(set, name);
    // tick drives the periodic re-pick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach, night, morning, band, lang, name, tick]);
}
