import { create } from 'zustand';

import {
  addCigarette,
  countCigarettesOnDate,
} from '@/data/repositories/cigaretteLog';
import {
  addCraving,
  countResistedOnDate,
} from '@/data/repositories/cravingLog';
import type { TriggerCategory } from '@/types/domain';
import { todayISO } from '@/utils/date';

interface LogInput {
  trigger?: TriggerCategory;
  intensity?: number;
  note?: string;
  /** Smoked only partially (shared) → lighter health impact. */
  shared?: boolean;
  /** Someone gave it (gifted) → no money impact. */
  gifted?: boolean;
}

interface LogsState {
  ready: boolean;
  todayCigarettes: number;
  todayResisted: number;
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

  init: async () => {
    try {
      await get().refreshToday();
      set({ ready: true });
    } catch {
      // SQLite unavailable (e.g. during web prerender) — render without counts.
      set({ ready: false });
    }
  },

  refreshToday: async () => {
    const today = todayISO();
    const [cigarettes, resisted] = await Promise.all([
      countCigarettesOnDate(today),
      countResistedOnDate(today),
    ]);
    set({ todayCigarettes: cigarettes, todayResisted: resisted });
  },

  logCigarette: async (input) => {
    await addCigarette({
      trigger: input?.trigger,
      note: input?.note,
      shared: input?.shared,
      gifted: input?.gifted,
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
