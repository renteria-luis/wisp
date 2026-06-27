/**
 * Whole-app data export + wipe (PROJECT.md §12 — privacy & data).
 *
 * Everything is on-device, so "export" just serializes the Zustand stores +
 * the SQLite time-series into a single JSON file and hands it to the share
 * sheet; "wipe" clears every table and resets every store. Native modules
 * (file system, sharing, SQLite) are imported lazily so web prerender / jest
 * never touch them.
 */
import { getDb } from '@/data/db';
import { useCompanion } from '@/store/useCompanion';
import { useEconomy } from '@/store/useEconomy';
import { useLogs } from '@/store/useLogs';
import { useDistractions } from '@/store/useDistractions';
import { usePlan } from '@/store/usePlan';
import { useSettings } from '@/store/useSettings';
import { useWishlist } from '@/store/useWishlist';
import { todayISO } from '@/utils/date';

const TABLES = [
  'cigarette_log',
  'craving_log',
  'check_in',
  'economy_ledger',
] as const;

async function dumpTables(): Promise<Record<string, unknown[]>> {
  const db = await getDb();
  const out: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    out[table] = await db.getAllAsync(`SELECT * FROM ${table} ORDER BY id`);
  }
  return out;
}

/** Assemble the full local dataset as a plain object (also used by tests). */
export function collectAppState(): Record<string, unknown> {
  const settings = useSettings.getState();
  const companion = useCompanion.getState();
  const economy = useEconomy.getState();
  return {
    app: 'Wisp',
    schema: 1,
    exportedAt: new Date().toISOString(),
    settings: {
      profile: settings.profile,
      pricing: settings.pricing,
      cigarettesPerDay: settings.cigarettesPerDay,
      userName: settings.userName,
      companionName: settings.companionName,
      language: settings.language,
      triggers: settings.triggers,
      quietHours: settings.quietHours,
      notificationsEnabled: settings.notificationsEnabled,
    },
    plan: usePlan.getState().plan,
    companion: { owned: companion.owned, equipped: companion.equipped },
    economy: { balance: economy.balance, pending: economy.pending },
    wishlist: useWishlist.getState().items,
    purchased: useWishlist.getState().purchased,
  };
}

export type ExportOutcome = 'shared' | 'unavailable' | 'error';

/** Serialize all data to a JSON file and open the share sheet. */
export async function exportAppData(): Promise<ExportOutcome> {
  try {
    const payload = { ...collectAppState(), logs: await dumpTables() };
    const json = JSON.stringify(payload, null, 2);
    const FS = await import('expo-file-system/legacy');
    const Sharing = await import('expo-sharing');
    const uri = `${FS.cacheDirectory ?? ''}wisp-export-${todayISO()}.json`;
    await FS.writeAsStringAsync(uri, json);
    if (!(await Sharing.isAvailableAsync())) return 'unavailable';
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Wisp',
      UTI: 'public.json',
    });
    return 'shared';
  } catch {
    return 'error';
  }
}

/** Clear every table and reset every store (leaves the app at onboarding). */
export async function wipeAppData(): Promise<void> {
  try {
    const db = await getDb();
    for (const table of TABLES) await db.runAsync(`DELETE FROM ${table}`);
  } catch {
    /* db unavailable (web) — stores are still reset below */
  }
  useEconomy.getState().reset();
  useCompanion.getState().reset();
  usePlan.getState().clearPlan();
  useWishlist.getState().reset();
  useDistractions.getState().reset();
  useSettings.getState().reset();
  useSettings.getState().setOnboardingCompleted(false);
  await useLogs
    .getState()
    .refreshToday()
    .catch(() => {});
}
