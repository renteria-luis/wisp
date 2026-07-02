import { create } from 'zustand';

export type CoachContext = 'breathe' | 'wait' | 'distract';

interface CoachState {
  /** Set while the craving toolkit is open, so the Home companion (visible
   *  behind the half-sheet) can coach with contextual lines. Null otherwise. */
  context: CoachContext | null;
  setContext: (context: CoachContext | null) => void;
}

export const useCoach = create<CoachState>((set) => ({
  context: null,
  setContext: (context) => set({ context }),
}));
