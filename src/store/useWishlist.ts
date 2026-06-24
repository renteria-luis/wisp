import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WishItem {
  id: string;
  name: string;
  /** Cost in the user's currency. */
  price: number;
  createdAt: string;
}

interface WishlistState {
  items: WishItem[];
  add: (name: string, price: number) => void;
  remove: (id: string) => void;
  reset: () => void;
}

/**
 * The user's "things to save up for" list (PROJECT.md §6.8 — savings goals).
 * Each item's progress is driven by cumulative money saved, computed in the UI.
 */
export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      add: (name, price) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: name.trim(),
              price,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      reset: () => set({ items: [] }),
    }),
    {
      name: 'wisp-wishlist',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);

/** Items sorted cheapest → priciest (display order). */
export function sortByPrice(items: WishItem[]): WishItem[] {
  return [...items].sort((a, b) => a.price - b.price);
}
