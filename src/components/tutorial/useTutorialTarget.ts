import { useEffect, useRef } from 'react';
import type { LayoutChangeEvent, View } from 'react-native';

import { type Rect, useTutorial } from '@/store/useTutorial';

import { TUTORIAL_STEPS } from './steps';

const near = (a: Rect | null, b: Rect | null): boolean =>
  !!a &&
  !!b &&
  Math.abs(a.x - b.x) < 0.5 &&
  Math.abs(a.y - b.y) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 &&
  Math.abs(a.height - b.height) < 0.5;

/**
 * Marks a view as a tour target. Attach the returned `ref` (and, for a target
 * inside a scroll view, `onLayout`) to the highlightable element. While the tour
 * is on and the current step points here, it **keeps re-measuring** the on-screen
 * rect (until it settles) and reports it to the store — so the spotlight lands
 * exactly on the element even after a navigation or scroll animation, instead of
 * racing them and landing in the wrong place.
 */
export function useTutorialTarget(id: string): {
  ref: React.RefObject<View | null>;
  onLayout: (e: LayoutChangeEvent) => void;
} {
  const ref = useRef<View | null>(null);
  const active = useTutorial((s) => s.active);
  const stepIndex = useTutorial((s) => s.stepIndex);
  const setRect = useTutorial((s) => s.setRect);
  const setContentY = useTutorial((s) => s.setContentY);

  const step = TUTORIAL_STEPS[stepIndex];
  const isCurrent =
    active && (step?.target === id || step?.alsoLit === id);

  useEffect(() => {
    if (!isCurrent) return;
    let cancelled = false;
    let last: Rect | null = null;

    // Keep measuring for the whole step (only pushing changes) so the spotlight
    // tracks the element through navigations and the scroll-into-view animation
    // and ends up exactly on it — never frozen at a stale, wrong position.
    const tick = (): void => {
      const node = ref.current;
      if (!node || cancelled) return;
      node.measureInWindow((x, y, width, height) => {
        if (cancelled || (width <= 0 && height <= 0)) return;
        const rect: Rect = { x, y, width, height };
        if (!near(rect, last)) {
          setRect(id, rect);
          last = rect;
        }
      });
    };

    const first = setTimeout(tick, 40);
    const interval = setInterval(tick, 120);
    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(interval);
      setRect(id, undefined);
    };
  }, [isCurrent, id, setRect]);

  const onLayout = (e: LayoutChangeEvent): void => {
    setContentY(id, e.nativeEvent.layout.y);
  };

  return { ref, onLayout };
}
