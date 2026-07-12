import * as Haptics from 'expo-haptics';

import { useSettings } from '@/store/useSettings';

/**
 * Every haptic in the app goes through here.
 *
 * Wisp makes no sound on purpose: a craving lands at work, at dinner, on the
 * street, and an app that chirps when you tap "I smoked" is one you can't open
 * in front of people — which is exactly when you need it. Touch says the same
 * thing, privately. That makes this the app's only feedback channel, so it is
 * worth keeping deliberate: one place decides how hard anything is ever allowed
 * to buzz, and one switch turns the lot off.
 *
 * Note what is missing: there is no failure or warning haptic. Logging a
 * cigarette is a light tick like any other tap. The app does not buzz at her
 * for smoking, and nothing here makes it easy to start.
 */

const enabled = (): boolean => useSettings.getState().hapticsEnabled;

/** The everyday tick: a button, a chip, a slider notch, a tab. */
export function tap(): void {
  if (enabled()) void Haptics.selectionAsync();
}

/** Something good landed: a resisted craving, a milestone, a check-in, a treat. */
export function success(): void {
  if (enabled())
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

/**
 * The breathing guide's phase cue. Each phase feels different on purpose, so
 * she can lower the phone, close her eyes and still follow along by touch —
 * which is the whole point of a breathing exercise you have to stare at.
 */
export function breathe(phase: 'inhale' | 'hold' | 'exhale'): void {
  if (!enabled()) return;
  if (phase === 'inhale') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } else if (phase === 'exhale') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  } else {
    void Haptics.selectionAsync();
  }
}
