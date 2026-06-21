/**
 * Local notification scheduling (PROJECT.md §9). I/O layer over
 * expo-notifications; the pure schedule specs come from `engine/triggers.ts`.
 *
 * expo-notifications is imported lazily so merely importing this module never
 * pulls the native module (keeps web prerender + tests clean). Only LOCAL
 * notifications are used — they work in Expo Go on iOS.
 */
import { buildTriggerWindows, situationalOffsets } from '@/engine/triggers';
import i18n from '@/i18n';
import type { QuietHours, TriggerCategory } from '@/types/domain';

const CRAVING_URL = '/craving';

async function getNotifications() {
  return import('expo-notifications');
}

/** How notifications display while the app is foregrounded. */
export async function configureNotificationHandler(): Promise<void> {
  try {
    const N = await getNotifications();
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  } catch {
    /* notifications unavailable */
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const N = await getNotifications();
    const current = await N.getPermissionsAsync();
    if (current.granted) return true;
    const requested = await N.requestPermissionsAsync();
    return requested.granted;
  } catch {
    return false;
  }
}

/** Cancel and (re)schedule the daily trigger nudges from the user's categories. */
export async function rescheduleTriggerNotifications(
  categories: TriggerCategory[],
  quiet: QuietHours | null,
  enabled: boolean,
): Promise<void> {
  try {
    const N = await getNotifications();
    await N.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    for (const w of buildTriggerWindows(categories, quiet)) {
      await N.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.triggerTitle'),
          body: i18n.t('notifications.triggerBody'),
          data: { url: CRAVING_URL },
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour: w.hour,
          minute: w.minute,
        },
      });
    }
  } catch {
    /* notifications unavailable */
  }
}

/** Situational "I'm out / drinking" mode: a burst of supportive pings. */
export async function startSituationalSupport(): Promise<void> {
  try {
    const N = await getNotifications();
    for (const minutes of situationalOffsets()) {
      await N.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.situationalTitle'),
          body: i18n.t('notifications.situationalBody'),
          data: { url: CRAVING_URL },
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: minutes * 60,
          repeats: false,
        },
      });
    }
  } catch {
    /* notifications unavailable */
  }
}
