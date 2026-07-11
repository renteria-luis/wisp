/**
 * Errors we deliberately swallow — SQLite absent during web prerender,
 * notifications unavailable in Expo Go, a best-effort ledger write — are the
 * right call in production: none of them should take a screen down. But an
 * empty `catch {}` also means a real bug can fail in total silence.
 *
 * So: shout in development, stay quiet in the shipped app.
 */
export function logDev(context: string, err: unknown): void {
  if (__DEV__) {
     
    console.warn(`[wisp] ${context}:`, err);
  }
}
