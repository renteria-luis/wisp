import { useTranslation } from 'react-i18next';

import { sortByPrice, useWishlist } from '@/store/useWishlist';

/** Suggested "what you could buy instead" goals when the wishlist is empty. */
export const DEFAULT_GOALS = [
  { key: 'coffee', price: 5 },
  { key: 'lunch', price: 15 },
  { key: 'movie', price: 30 },
  { key: 'dinner', price: 60 },
  { key: 'getaway', price: 250 },
] as const;

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
 * `saved`. Uses the user's wishlist when it has items, else the defaults.
 */
export function useSavingsGoals(saved: number): {
  goals: SavingsGoal[];
  nextGoal?: SavingsGoal;
} {
  const { t } = useTranslation();
  const items = useWishlist((s) => s.items);
  const source = items.length
    ? sortByPrice(items).map((i) => ({ key: i.id, name: i.name, price: i.price }))
    : DEFAULT_GOALS.map((g) => ({
        key: g.key,
        name: t(`goals.${g.key}`),
        price: g.price,
      }));
  const goals: SavingsGoal[] = source.map((g) => ({
    ...g,
    pct: g.price > 0 ? Math.min(1, saved / g.price) : 1,
    reached: saved >= g.price,
  }));
  return { goals, nextGoal: goals.find((g) => !g.reached) };
}
