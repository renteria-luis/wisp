import { create } from 'zustand';

import {
  addCigarette,
  countCigarettesOnDate,
  getLastCigaretteTimestamp,
} from '@/data/repositories/cigaretteLog';
import {
  addCraving,
  countResistedOnDate,
} from '@/data/repositories/cravingLog';
import type { TriggerCategory } from '@/types/domain';
import { todayISO } from '@/utils/date';
import { logDev } from '@/utils/logger';

interface LogInput {
  trigger?: TriggerCategory;
  intensity?: number;
  note?: string;
  /** Smoked only partially (shared) → lighter health impact. */
  shared?: boolean;
  /** Someone gave it (gifted) → no money impact. */
  gifted?: boolean;
  /** ISO timestamp the cigarette was smoked (defaults to now). */
  timestamp?: string;
}

interface LogsState {
  ready: boolean;
  todayCigarettes: number;
  todayResisted: number;
  /**
   * Bumped on every log write (incl. backfills to past days). Screens that
   * derive from the full log history — the progress graph, the history list —
   * watch this to refetch, since today's count alone doesn't change when a
   * past day is edited.
   */
  revision: number;
  /** ISO timestamp of the most recent cigarette ever (null if none). */
  lastCigaretteAt: string | null;
  init: () => Promise<void>;
  refreshToday: () => Promise<void>;
  logCigarette: (input?: LogInput) => Promise<void>;
  logResistedCraving: (input?: LogInput) => Promise<void>;
}

/**
 * Reactive cache over the SQLite logs. SQLite is the source of truth; this store
 * just holds today's derived counts and re-queries after each write.
 */
export const useLogs = create<LogsState>((set, get) => ({
  ready: false,
  todayCigarettes: 0,
  todayResisted: 0,
  revision: 0,
  lastCigaretteAt: null,

  init: async () => {
    try {
      await get().refreshToday();
      set({ ready: true });
    } catch (err) {
      logDev('store/useLogs', err);
      // SQLite unavailable (e.g. during web prerender) — render without counts.
      set({ ready: false });
    }
  },

  refreshToday: async () => {
    const today = todayISO();
    const [cigarettes, resisted, lastCig] = await Promise.all([
      countCigarettesOnDate(today),
      countResistedOnDate(today),
      getLastCigaretteTimestamp(),
    ]);
    set((s) => ({
      todayCigarettes: cigarettes,
      todayResisted: resisted,
      lastCigaretteAt: lastCig,
      revision: s.revision + 1,
    }));
  },

  logCigarette: async (input) => {
    await addCigarette({
      trigger: input?.trigger,
      note: input?.note,
      shared: input?.shared,
      gifted: input?.gifted,
      timestamp: input?.timestamp,
    });
    await get().refreshToday();
  },

  logResistedCraving: async (input) => {
    await addCraving({
      resisted: true,
      trigger: input?.trigger,
      intensity: input?.intensity,
      note: input?.note,
    });
    await get().refreshToday();
  },
}));
