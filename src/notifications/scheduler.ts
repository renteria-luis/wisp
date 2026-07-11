/**
 * Local notification scheduling (PROJECT.md §9). I/O layer over
 * expo-notifications; the pure schedule specs come from `engine/triggers.ts`.
 *
 * expo-notifications is imported lazily so merely importing this module never
 * pulls the native module (keeps web prerender + tests clean). Only LOCAL
 * notifications are used — they work in Expo Go on iOS.
 */
import { dailyNudgeWindows, situationalOffsets } from '@/engine/triggers';
import i18n from '@/i18n';
import type { QuietHours, TriggerCategory } from '@/types/domain';
import { logDev } from '@/utils/logger';

const CRAVING_URL = '/craving';
const LOG_URL = '/log';

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
  } catch (err) {
    logDev('notifications/scheduler', err);
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
  } catch (err) {
    logDev('notifications/scheduler', err);
    return false;
  }
}

/**
 * Cancel and (re)schedule the daily nudges — deliberately sparse: ~one every
 * ~3h across the day (minus quiet hours), with rotating gentle copy. The last
 * (evening) slot softly invites logging a slip; kept low-key on purpose so a
 * reminder never nags someone into smoking. Trigger categories are no longer
 * used to fan out extra pings.
 */
export async function rescheduleTriggerNotifications(
  _categories: TriggerCategory[],
  quiet: QuietHours | null,
  enabled: boolean,
): Promise<void> {
  try {
    const N = await getNotifications();
    await N.cancelAllScheduledNotificationsAsync();
    if (!enabled) return;
    const windows = dailyNudgeWindows(quiet);
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i]!;
      const isLogReminder = windows.length > 1 && i === windows.length - 1;
      await N.scheduleNotificationAsync({
        content: {
          title: i18n.t('notifications.nudgeTitle'),
          body: isLogReminder
            ? i18n.t('notifications.logNudgeBody')
            : i18n.t(`notifications.nudgeBody${(i % 3) + 1}`),
          data: { url: isLogReminder ? LOG_URL : CRAVING_URL },
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour: w.hour,
          minute: w.minute,
        },
      });
    }
  } catch (err) {
    logDev('notifications/scheduler', err);
    /* notifications unavailable */
  }
}

/** Fire an immediate local notification celebrating a newly-reached milestone. */
export async function notifyMilestoneReached(title: string): Promise<void> {
  try {
    const N = await getNotifications();
    await N.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.milestoneTitle'),
        body: i18n.t('notifications.milestoneBody', { title }),
      },
      trigger: null, // present right away
    });
  } catch (err) {
    logDev('notifications/scheduler', err);
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
  } catch (err) {
    logDev('notifications/scheduler', err);
    /* notifications unavailable */
  }
}
