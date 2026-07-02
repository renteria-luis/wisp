import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Cosmetic, CosmeticType } from '@/types/domain';

/** Default free companion color, owned from the start. */
const DEFAULT_COLOR_ID = 'color_sage';
/** Default free character (the wisp), owned + equipped from the start. */
const DEFAULT_CHARACTER_ID = 'char_wisp';

interface CompanionState {
  /** Owned cosmetic ids. */
  owned: string[];
  /** Equipped cosmetic id per slot. */
  equipped: Partial<Record<CosmeticType, string>>;
  /** Equipped sprite-accessory ids worn on the illustrated companion. */
  worn: string[];
  isOwned: (id: string) => boolean;
  add: (id: string) => void;
  equip: (cosmetic: Cosmetic) => void;
  setWorn: (worn: string[]) => void;
  /** Directly set the equipped character (used by the Home sprite picker). */
  setCharacter: (id: string) => void;
  reset: () => void;
}

const initial = {
  owned: [DEFAULT_COLOR_ID, DEFAULT_CHARACTER_ID],
  equipped: {
    companion_color: DEFAULT_COLOR_ID,
    character: DEFAULT_CHARACTER_ID,
  } as Partial<Record<CosmeticType, string>>,
  worn: [] as string[],
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
      setWorn: (worn) => set({ worn }),
      setCharacter: (id) =>
        set((s) => ({ equipped: { ...s.equipped, character: id } })),
      reset: () => set({ ...initial }),
    }),
    {
      name: 'wisp-companion',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      // v2 introduced the `character` slot — make sure the free wisp is owned
      // and equipped for installs created before characters existed.
      migrate: (state, version) => {
        const s = state as {
          owned?: string[];
          equipped?: Record<string, string>;
        };
        if (version < 2) {
          const owned = s.owned ?? [DEFAULT_COLOR_ID];
          return {
            owned: owned.includes(DEFAULT_CHARACTER_ID)
              ? owned
              : [...owned, DEFAULT_CHARACTER_ID],
            equipped: {
              character: DEFAULT_CHARACTER_ID,
              ...(s.equipped ?? { companion_color: DEFAULT_COLOR_ID }),
            },
          } as CompanionState;
        }
        return s as CompanionState;
      },
      partialize: (s) => ({
        owned: s.owned,
        equipped: s.equipped,
        worn: s.worn,
      }),
    },
  ),
);
