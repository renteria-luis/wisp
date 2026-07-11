/** One step of the guided tour. Copy lives in i18n under `tutorial.<key>`. */
export type TutorialStep = {
  /** i18n key: `tutorial.<key>.title` / `.body`. */
  key: string;
  /** Target id to spotlight (see useTutorialTarget), or null for a centered card. */
  target: string | null;
  /** A second element kept lit alongside `target` — shown, but never tappable
   *  (the touch layer only ever opens the primary hole). */
  alsoLit?: string;
  /** Step key the Back button jumps to instead of the previous step (used when
   *  the previous step can't be replayed as-is — e.g. after a purchase). */
  backToKey?: string;
  /** Which overlay instance draws this step. 'modal' targets live inside a modal
   *  screen (Log / history / …), which a root overlay can't cover — those
   *  screens mount their own overlay. Defaults to 'root' (the tab screens). */
  scope?: 'root' | 'modal';
  /** Switch to this bottom tab before showing the step. */
  nav?: '/home' | '/plan' | '/progress';
  /** A modal that must be open for this step ('log' | 'history' | 'wishlist').
   *  The controller opens/closes it so forward/back stay consistent. */
  modal?: string;
  /** Scroll this screen so `target` is in view (screen id → registered scroller). */
  scrollScreen?: string;
  /** Forced-tap step: no "Next" button; it advances when the user performs the
   *  real action whose id matches this (reported via `signalAction`). */
  advanceOn?: string;
  /** For a forced-tap step, an identical live button rendered over the real one
   *  (so it presses with the normal animation instead of a dead hit-area). */
  button?: {
    labelKey: string;
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md';
    icon?: 'gift';
  };
  /** Forced step whose hole stays genuinely open (touches fall through to the
   *  real controls). Only safe for 'modal'-scope steps, where the overlay lives
   *  in the SAME screen as the target (no navigator boundary to cross) — used
   *  for typing into real inputs. */
  passThrough?: boolean;
  /** Fixed tooltip side (so it never jumps once the target is measured). Use
   *  'top' when the target sits low on the screen. Defaults to 'bottom'. */
  tip?: 'top' | 'bottom';
  /** Self-advancing step (a scripted demo runs on the screen) — the tooltip
   *  shows no Next button; the screen calls `next()` when the demo finishes. */
  auto?: boolean;
  /** A sandbox side-effect to run on entering the step. */
  sandbox?: 'giveCoins' | 'reset' | 'clearWish';
};

/**
 * The scripted tour. It runs on a throwaway sandbox (0% template) — the user
 * really taps Log/Save, sees the cigarette land in the trend and its record in
 * the history, and walks the rest of the app, all without touching real data.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  { key: 'intro', target: null, nav: '/home' },
  {
    key: 'log',
    target: 'home-log',
    nav: '/home',
    tip: 'top',
    advanceOn: 'tap-log',
    button: { labelKey: 'home.logAction', variant: 'secondary' },
  },
  {
    key: 'save1',
    target: 'log-options',
    scope: 'modal',
    modal: 'log',
    nav: '/home',
    passThrough: true,
  },
  {
    key: 'save2',
    target: 'log-save',
    scope: 'modal',
    modal: 'log',
    nav: '/home',
    tip: 'top',
    advanceOn: 'save',
    // The real Save button takes the tap (same screen as this overlay), so the
    // trigger/note the user just picked ride along into the practice log.
    passThrough: true,
  },
  {
    key: 'trend',
    target: 'progress-trend',
    nav: '/progress',
    scrollScreen: 'progress',
    advanceOn: 'open-history',
  },
  {
    key: 'history',
    target: 'history-cig',
    alsoLit: 'history-add',
    scope: 'modal',
    modal: 'history',
    nav: '/progress',
    passThrough: true,
  },
  {
    key: 'milestones',
    target: 'progress-milestones',
    nav: '/progress',
    scrollScreen: 'progress',
  },
  {
    key: 'saved',
    target: 'progress-saved',
    nav: '/progress',
    scrollScreen: 'progress',
    sandbox: 'giveCoins',
  },
  {
    key: 'wishlistBtn',
    target: 'progress-wishlist',
    nav: '/progress',
    scrollScreen: 'progress',
    advanceOn: 'open-wishlist',
    button: {
      labelKey: 'progress.wishlistLink',
      variant: 'primary',
      size: 'sm',
      icon: 'gift',
    },
  },
  {
    key: 'wish1',
    target: 'wishlist-form',
    scope: 'modal',
    modal: 'wishlist',
    nav: '/progress',
    advanceOn: 'wish-add',
    passThrough: true,
    sandbox: 'clearWish',
  },
  {
    key: 'wish2',
    target: 'wishlist-item',
    scope: 'modal',
    modal: 'wishlist',
    nav: '/progress',
    advanceOn: 'wish-buy',
    passThrough: true,
    tip: 'top',
  },
  {
    key: 'wish3',
    target: 'wishlist-treated',
    scope: 'modal',
    modal: 'wishlist',
    nav: '/progress',
    scrollScreen: 'wishlist',
    tip: 'top',
    // Going back to wish2 would be a dead end (the item is already bought and
    // its button is gone) — send them back to re-add it instead.
    backToKey: 'wish1',
  },
  {
    key: 'plan',
    target: 'plan-journey',
    nav: '/plan',
    scrollScreen: 'plan',
  },
  {
    key: 'craving',
    target: 'home-craving',
    nav: '/home',
    tip: 'top',
    advanceOn: 'open-craving',
    button: { labelKey: 'home.cravingAction', variant: 'primary' },
  },
  {
    key: 'craving2',
    target: 'craving-tools',
    scope: 'modal',
    modal: 'craving',
    nav: '/home',
    tip: 'top',
    auto: true,
  },
  {
    key: 'craving3',
    target: 'craving-resisted',
    // Keep the three tools lit (they carry on cycling) while we point at the win.
    alsoLit: 'craving-tools',
    scope: 'modal',
    modal: 'craving',
    nav: '/home',
    tip: 'top',
    advanceOn: 'resisted',
    // The real button takes the tap (same screen as this overlay), so it plays
    // its normal celebration.
    passThrough: true,
    // Back would land on the self-advancing tools demo, which would just push
    // us straight back here — return to the craving button instead.
    backToKey: 'craving',
  },
  { key: 'done', target: null, nav: '/home', sandbox: 'reset' },
];

export const TUTORIAL_STEP_COUNT = TUTORIAL_STEPS.length;
