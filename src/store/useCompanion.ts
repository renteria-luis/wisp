import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Cosmetic, CosmeticType } from '@/types/domain';

/** Default free companion color, owned from the start. */
const DEFAULT_COLOR_ID = 'color_sage';

interface CompanionState {
  /** Owned cosmetic ids. */
  owned: string[];
  /** Equipped cosmetic id per slot. */
  equipped: Partial<Record<CosmeticType, string>>;
  isOwned: (id: string) => boolean;
  add: (id: string) => void;
  equip: (cosmetic: Cosmetic) => void;
  reset: () => void;
}

const initial = {
  owned: [DEFAULT_COLOR_ID],
  equipped: { companion_color: DEFAULT_COLOR_ID } as Partial<
    Record<CosmeticType, string>
  >,
};

export const useCompanion = create<CompanionState>()(
  persist(
    (set, get) => ({
      ...initial,
      isOwned: (id) => get().owned.includes(id),
      add: (id) =>
        set((s) => (s.owned.includes(id) ? s : { owned: [...s.owned, id] })),
      equip: (cosmetic) =>
        set((s) => ({
          equipped: { ...s.equipped, [cosmetic.type]: cosmetic.id },
        })),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'wisp-companion',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (s) => ({ owned: s.owned, equipped: s.equipped }),
    },
  ),
);
