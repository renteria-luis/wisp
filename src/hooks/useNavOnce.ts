import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Lets a screen leave itself only once per visit.
 *
 * Two taps on Next land in the same frame — long before the screen has begun to
 * move — and a stack honours both, pushing the next screen twice. You only find
 * out on the way back, when the same screen shows up again with the same data
 * in it. Debouncing by time would be a guess; this is exact: the screen has
 * departed, so it cannot depart again. The lock lifts when the screen is
 * focused once more, which is precisely when the user really has come back to
 * it and Next means something again.
 */
export function useNavOnce(): (go: () => void) => void {
  const departed = useRef(false);

  useFocusEffect(
    useCallback(() => {
      departed.current = false;
    }, []),
  );

  return useCallback((go: () => void) => {
    if (departed.current) return;
    departed.current = true;
    go();
  }, []);
}
