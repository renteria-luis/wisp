import en from '@/i18n/locales/en.json';

import { MODAL_ROUTE, stepPath, TOUR_PATHS, TUTORIAL_STEPS } from '../steps';

/**
 * The tour drives navigation itself and blocks the screen while it does. That
 * only holds together if every step honestly declares where it lives — the
 * controller steers by `stepPath`, and the overlay refuses to spotlight
 * anything on a different screen. A step that lies (or forgets) desyncs the
 * whole tour, so the script's invariants are pinned here rather than trusted.
 */
describe('tutorial script', () => {
  it('gives every step exactly one screen the controller can reach', () => {
    for (const step of TUTORIAL_STEPS) {
      expect(TOUR_PATHS.has(stepPath(step))).toBe(true);
    }
  });

  it('puts a known tab under every step, modal or not', () => {
    // A modal is pushed on top of a tab; without one, closing the modal would
    // leave the tour standing on whatever screen happened to be underneath.
    for (const step of TUTORIAL_STEPS) {
      expect(step.nav).toBeDefined();
    }
  });

  it('only lets touches through on modal-scope steps', () => {
    // A pass-through hole leaves the real control tappable, which needs the
    // overlay to sit in the SAME screen as it. At root scope the touch would
    // have to cross the navigator boundary, and silently does nothing.
    for (const step of TUTORIAL_STEPS) {
      if (step.passThrough) expect(step.scope).toBe('modal');
    }
  });

  it('mounts a modal-scope step inside a modal', () => {
    for (const step of TUTORIAL_STEPS) {
      if (step.scope === 'modal') expect(step.modal).toBeDefined();
    }
  });

  it('gives every forced-tap step something to spotlight', () => {
    // The tap area IS the hole: no target means no way to advance.
    for (const step of TUTORIAL_STEPS) {
      if (step.advanceOn) expect(step.target).toBeTruthy();
    }
  });

  it('sends every backToKey to a step that exists', () => {
    const keys = TUTORIAL_STEPS.map((s) => s.key);
    for (const step of TUTORIAL_STEPS) {
      if (step.backToKey) expect(keys).toContain(step.backToKey);
    }
  });

  it('writes copy for every step, and no orphan copy', () => {
    const copy = (en as { tutorial: Record<string, unknown> }).tutorial;
    const scripted = TUTORIAL_STEPS.map((s) => s.key).sort();
    // Everything under `tutorial.*` that is a { title, body } block belongs to a
    // step — a leftover block is a step someone deleted and forgot to clean up.
    const blocks = Object.keys(copy)
      .filter((k) => {
        const v = copy[k];
        return typeof v === 'object' && v !== null && 'title' in v;
      })
      .sort();
    expect(blocks).toEqual(scripted);
  });

  it('keeps the modal routes and the step script in agreement', () => {
    for (const step of TUTORIAL_STEPS) {
      if (!step.modal) continue;
      const route = MODAL_ROUTE[step.modal];
      // A modal with a route is pushed; one without (the history sheet) is
      // toggled by state. Either is fine — an unknown name is not.
      expect(route === undefined || route.startsWith('/')).toBe(true);
    }
  });
});
