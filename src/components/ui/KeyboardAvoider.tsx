import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

/**
 * Keeps screen content — including a pinned CTA button — above the keyboard on
 * iOS so the user can always see/reach the button while typing (no need to tap
 * away or hunt for "done"). Wrap the content INSIDE a SafeAreaView. On Android
 * the OS handles it via adjustResize, so no behavior is forced there.
 */
export function KeyboardAvoider({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
