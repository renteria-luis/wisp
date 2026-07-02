import { sortByPrice, useWishlist } from '@/store/useWishlist';

export interface SavingsGoal {
  key: string;
  name: string;
  price: number;
  /** 0..1 progress of current savings toward this goal. */
  pct: number;
  reached: boolean;
}

/**
 * The savings goals to show, cheapest → priciest, with progress against
 * `saved`. These are ONLY the user's own wishlist items — no placeholder
 * suggestions; the list is empty until they add their first wish.
 */
export function useSavingsGoals(saved: number): {
  goals: SavingsGoal[];
  nextGoal?: SavingsGoal;
} {
  const items = useWishlist((s) => s.items);
  const goals: SavingsGoal[] = sortByPrice(items).map((i) => ({
    key: i.id,
    name: i.name,
    price: i.price,
    pct: i.price > 0 ? Math.min(1, saved / i.price) : 1,
    reached: saved >= i.price,
  }));
  return { goals, nextGoal: goals.find((g) => !g.reached) };
}
