import { useEffect, useState } from 'react';

/** Minimal shape of a zustand store wrapped with the `persist` middleware. */
type PersistedStore = {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (cb: () => void) => () => void;
  };
};

/**
 * Returns `true` once a persisted store has finished rehydrating from storage.
 * Lets screens avoid acting on default state before AsyncStorage has loaded
 * (e.g. the onboarding gate flashing the wrong route).
 */
export function useStoreHydrated(store: PersistedStore): boolean {
  const [hydrated, setHydrated] = useState(() => store.persist.hasHydrated());

  useEffect(() => {
    if (store.persist.hasHydrated()) return;
    return store.persist.onFinishHydration(() => setHydrated(true));
  }, [store]);

  return hydrated;
}
