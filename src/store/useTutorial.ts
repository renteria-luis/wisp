import { create } from 'zustand';

export type Rect = { x: number; y: number; width: number; height: number };

interface TutorialState {
  /** The guided tour is running. */
  active: boolean;
  /** Index into the tour script (see components/tutorial/steps). */
  stepIndex: number;
  /** Measured on-screen rects of highlightable targets, keyed by id. */
  rects: Record<string, Rect | undefined>;
  /** Each target's Y offset inside its scroll content (for scroll-into-view). */
  contentY: Record<string, number | undefined>;
  /** Scroll functions registered by scrollable screens, keyed by screen id. */
  scrollers: Record<string, ((y: number) => void) | undefined>;
  /** The id of the real action the user just performed (forced-tap steps advance
   *  when it matches the current step's `advanceOn`). Consumed by the overlay. */
  pendingAction: string | null;
  /** Which modal is currently open ('log' | 'wishlist' | 'history' | null), so
   *  the controller can keep the right nav state across forward/back without
   *  pushing it twice. */
  openModal: string | null;
  /** True while a step is navigating/scrolling into place — the overlay hides
   *  the spotlight until the screen settles (so it never flashes on the wrong
   *  element mid-transition). */
  transitioning: boolean;

  start: () => void;
  stop: () => void;
  next: () => void;
  back: () => void;
  /** Jump to an exact step (used by a step's `backToKey` override). */
  goTo: (index: number) => void;
  /** A real control reports the action it performed (e.g. 'tap-log', 'save'). */
  signalAction: (id: string) => void;
  clearAction: () => void;
  setOpenModal: (name: string | null) => void;
  setTransitioning: (v: boolean) => void;
  setRect: (id: string, rect: Rect | undefined) => void;
  setContentY: (id: string, y: number) => void;
  setScroller: (screen: string, fn: ((y: number) => void) | undefined) => void;
}

/**
 * Controls the post-onboarding guided tour: which step is showing and where the
 * highlightable targets are. Not persisted — it's a transient UI session; the
 * "already seen it" flag lives in `useSettings.tutorialCompleted`.
 */
export const useTutorial = create<TutorialState>((set) => ({
  active: false,
  stepIndex: 0,
  rects: {},
  contentY: {},
  scrollers: {},
  pendingAction: null,
  openModal: null,
  transitioning: false,

  start: () =>
    set({
      active: true,
      stepIndex: 0,
      rects: {},
      pendingAction: null,
      transitioning: true,
    }),
  stop: () => set({ active: false, stepIndex: 0, pendingAction: null }),
  next: () => set((s) => ({ stepIndex: s.stepIndex + 1, pendingAction: null })),
  back: () =>
    set((s) => ({ stepIndex: Math.max(0, s.stepIndex - 1), pendingAction: null })),
  goTo: (index) =>
    set({ stepIndex: Math.max(0, index), pendingAction: null }),
  signalAction: (id) => set({ pendingAction: id }),
  clearAction: () => set({ pendingAction: null }),
  setOpenModal: (openModal) => set({ openModal }),
  setTransitioning: (transitioning) => set({ transitioning }),
  setRect: (id, rect) => set((s) => ({ rects: { ...s.rects, [id]: rect } })),
  setContentY: (id, y) => set((s) => ({ contentY: { ...s.contentY, [id]: y } })),
  setScroller: (screen, fn) =>
    set((s) => ({ scrollers: { ...s.scrollers, [screen]: fn } })),
}));
