import { Redirect } from 'expo-router';

/**
 * Entry redirect. In Phase 2 this will read a persisted "onboarding completed"
 * flag and send first-time users through `(onboarding)`. For now (no store yet)
 * it lands straight on the tabs so the app boots to a placeholder Home.
 */
export default function Index() {
  return <Redirect href="/home" />;
}
