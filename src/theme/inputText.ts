import type { TextStyle } from 'react-native';

/**
 * iOS clips a TextInput's descenders (the tail of "p", "y", "g") while the field
 * is focused whenever a lineHeight is set — and our `text-base` class sets one.
 * Spread this AFTER the className so the line height is dropped and the font's
 * own metrics are used. Apply to every TextInput.
 */
export const inputText: TextStyle = { lineHeight: undefined };
