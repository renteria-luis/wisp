import { create } from 'zustand';

export interface Celebration {
  emoji: string;
  message: string;
}

interface CelebrationState {
  /** The celebration currently on screen, or null. */
  current: Celebration | null;
  /** Show a quick, auto-dismissing celebration burst. */
  celebrate: (emoji: string, message: string) => void;
  dismiss: () => void;
}

/**
 * Transient (non-persisted) store for tasteful little "you did it!" moments —
 * a new health milestone, buying something off the wishlist, or beating a
 * craving. Any screen can trigger one; a single global overlay renders it.
 */
export const useCelebration = create<CelebrationState>((set) => ({
  current: null,
  celebrate: (emoji, message) => set({ current: { emoji, message } }),
  dismiss: () => set({ current: null }),
}));
