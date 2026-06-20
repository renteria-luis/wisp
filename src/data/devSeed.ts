/**
 * Dev-only seed (PROJECT.md §16). Populates ~2 weeks of sample logs with a
 * gentle downward trend so charts and adherence have something to chew on.
 * Guarded by __DEV__; intended to be called manually, not on every launch.
 */
import { addDaysISO, todayISO } from '@/utils/date';

import { addCigarette } from './repositories/cigaretteLog';
import { addCraving } from './repositories/cravingLog';

export async function devSeedLogs(): Promise<void> {
  if (!__DEV__) return;

  const today = todayISO();
  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const date = addDaysISO(today, -daysAgo);
    const count = Math.max(0, Math.round(4 - (13 - daysAgo) * 0.15));
    for (let i = 0; i < count; i++) {
      const hour = String(9 + i).padStart(2, '0');
      await addCigarette({ timestamp: `${date}T${hour}:30:00.000Z` });
    }
    if (daysAgo % 2 === 0) {
      await addCraving({ resisted: true, timestamp: `${date}T16:00:00.000Z` });
    }
  }
}
