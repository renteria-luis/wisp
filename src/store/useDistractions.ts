import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface DistractionsState {
  /** How many times each distraction helped resist a craving. */
  helped: Record<string, number>;
  recordHelped: (id: string) => void;
  reset: () => void;
}

/** Remembers which distractions actually helped the user beat a craving, so the
 *  toolkit can surface "what's worked for you" sorted by what helps most. */
export const useDistractions = create<DistractionsState>()(
  persist(
    (set) => ({
      helped: {},
      recordHelped: (id) =>
        set((s) => ({ helped: { ...s.helped, [id]: (s.helped[id] ?? 0) + 1 } })),
      reset: () => set({ helped: {} }),
    }),
    {
      name: 'wisp-distractions',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);

/** Distraction ids sorted by how much they've helped (most first). */
export function topHelped(helped: Record<string, number>): string[] {
  return Object.keys(helped)
    .filter((id) => (helped[id] ?? 0) > 0)
    .sort((a, b) => (helped[b] ?? 0) - (helped[a] ?? 0));
}
