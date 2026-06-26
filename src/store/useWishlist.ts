import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WishItem {
  id: string;
  name: string;
  /** Cost in the user's currency. */
  price: number;
  /** Optional note about the item. */
  note?: string;
  createdAt: string;
}

export interface PurchasedItem extends WishItem {
  /** ISO timestamp the user marked it bought. */
  purchasedAt: string;
}

interface WishlistState {
  items: WishItem[];
  /** Things the user actually bought thanks to quitting (the payoff log). */
  purchased: PurchasedItem[];
  add: (name: string, price: number, note?: string) => void;
  remove: (id: string) => void;
  /** Move an item to the purchased log with today's date. */
  markBought: (id: string) => void;
  removePurchased: (id: string) => void;
  reset: () => void;
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * The user's "things to save up for" list (PROJECT.md §6.8 — savings goals).
 * Each item's progress is driven by cumulative money saved, computed in the UI.
 * Items marked bought move to `purchased` — the "look what quitting got me" log.
 */
export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      items: [],
      purchased: [],
      add: (name, price, note) =>
        set((s) => ({
          items: [
            ...s.items,
            {
              id: newId(),
              name: name.trim(),
              price,
              note: note?.trim() ? note.trim() : undefined,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      markBought: (id) =>
        set((s) => {
          const item = s.items.find((i) => i.id === id);
          if (!item) return s;
          return {
            items: s.items.filter((i) => i.id !== id),
            purchased: [
              { ...item, purchasedAt: new Date().toISOString() },
              ...s.purchased,
            ],
          };
        }),
      removePurchased: (id) =>
        set((s) => ({ purchased: s.purchased.filter((i) => i.id !== id) })),
      reset: () => set({ items: [], purchased: [] }),
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
