import { create } from 'zustand';

import { nowISO } from '@/utils/date';

export type SandboxWishItem = {
  id: string;
  name: string;
  price: number;
  purchased: boolean;
};

/** A cigarette "logged" during the tour, with whatever detail the user filled
 *  in — so the practice history shows a trigger/note only when there is one. */
export type SandboxCig = {
  timestamp: string;
  trigger: string | null;
  note: string | null;
  shared: boolean;
  gifted: boolean;
};

interface TutorialSandboxState {
  /** Cigarettes "logged" inside the tour (the real DB is never touched). */
  cigs: SandboxCig[];
  /** Pretend savings/coins the tour hands the user so they can buy a treat. */
  coins: number;
  /** Wishlist the user builds during the tour. */
  wishlist: SandboxWishItem[];

  reset: () => void;
  addCig: (cig: Omit<SandboxCig, 'timestamp'>) => void;
  giveCoins: (n: number) => void;
  addWish: (name: string, price: number) => string;
  purchaseWish: (id: string) => void;
  /** Wipe just the practice wishlist (re-entering the wish step stays clean). */
  clearWishlist: () => void;
}

/**
 * A throwaway, in-memory "practice world" used only while the guided tour runs.
 * Screens read it (instead of the user's real data) when the tour is active, so
 * the user can add a cigarette, build a wishlist and buy a treat on a clean 0%
 * template without ever touching their real logs/economy. Discarded on reset.
 */
export const useTutorialSandbox = create<TutorialSandboxState>((set) => ({
  cigs: [],
  coins: 0,
  wishlist: [],

  reset: () => set({ cigs: [], coins: 0, wishlist: [] }),
  addCig: (cig) =>
    set((s) => ({ cigs: [...s.cigs, { ...cig, timestamp: nowISO() }] })),
  giveCoins: (n) => set((s) => ({ coins: s.coins + n })),
  addWish: (name, price) => {
    const id = `sbx_${Date.now()}`;
    set((s) => ({
      wishlist: [...s.wishlist, { id, name, price, purchased: false }],
    }));
    return id;
  },
  purchaseWish: (id) =>
    set((s) => ({
      wishlist: s.wishlist.map((w) =>
        w.id === id ? { ...w, purchased: true } : w,
      ),
    })),
  clearWishlist: () => set({ wishlist: [] }),
}));
