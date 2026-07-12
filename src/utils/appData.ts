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
import { useRecovery } from '@/store/useRecovery';
import { useSettings } from '@/store/useSettings';
import { useWishlist } from '@/store/useWishlist';
import type { Plan } from '@/types/domain';
import { todayISO } from '@/utils/date';
import { logDev } from '@/utils/logger';

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

/**
 * Assemble the full local dataset as a plain object (also used by tests).
 *
 * Deliberately broad — the point is a rich, per-day time series (moods, notes,
 * cravings, cigarettes, savings, recovery) that could later feed plan tuning,
 * suggestions, or ML. Add here + in `restoreAppState` to keep import/export
 * symmetric.
 */
export function collectAppState(): Record<string, unknown> {
  const settings = useSettings.getState();
  const companion = useCompanion.getState();
  const economy = useEconomy.getState();
  const recovery = useRecovery.getState();
  return {
    app: 'Wisp',
    schema: 2,
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
      theme: settings.theme,
      situationalUntil: settings.situationalUntil,
      seenEggs: settings.seenEggs,
      lastMorningGreet: settings.lastMorningGreet,
      isPremium: settings.isPremium,
      onboardingCompleted: settings.onboardingCompleted,
    },
    plan: usePlan.getState().plan,
    companion: { owned: companion.owned, equipped: companion.equipped },
    economy: {
      balance: economy.balance,
      pending: economy.pending,
      lastAccrualAt: economy.lastAccrualAt,
    },
    recovery: {
      anchorMs: recovery.anchorMs,
      baseHours: recovery.baseHours,
      seenMilestones: recovery.seenMilestones,
    },
    distractionsHelped: useDistractions.getState().helped,
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
  } catch (err) {
    logDev('utils/appData', err);
    return 'error';
  }
}

export type ImportOutcome = 'imported' | 'cancelled' | 'invalid' | 'error';

type Row = Record<string, string | number | null>;

async function restoreTable(
  db: Awaited<ReturnType<typeof getDb>>,
  table: string,
  rows: unknown[],
): Promise<void> {
  await db.runAsync(`DELETE FROM ${table}`);
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    const row = r as Row;
    const cols = Object.keys(row);
    if (cols.length === 0) continue;
    const placeholders = cols.map(() => '?').join(', ');
    await db.runAsync(
      `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`,
      ...cols.map((c) => row[c] ?? null),
    );
  }
}

/** Restore every store + SQLite table from a previously exported payload. */
async function restoreAppState(data: Record<string, unknown>): Promise<void> {
  type SettingsPatch = Partial<ReturnType<typeof useSettings.getState>>;
  if (data.settings && typeof data.settings === 'object') {
    useSettings.setState(data.settings as SettingsPatch);
  }
  if ('plan' in data) {
    usePlan.setState({ plan: (data.plan ?? null) as Plan | null });
  }
  if (data.companion && typeof data.companion === 'object') {
    useCompanion.setState(
      data.companion as Partial<ReturnType<typeof useCompanion.getState>>,
    );
  }
  const economy = data.economy as Record<string, unknown> | undefined;
  if (economy) {
    useEconomy.setState({
      balance: Number(economy.balance) || 0,
      pending: Number(economy.pending) || 0,
      lastAccrualAt: (economy.lastAccrualAt as string | null) ?? null,
    });
  }
  const recovery = data.recovery as Record<string, unknown> | undefined;
  if (recovery) {
    useRecovery.setState({
      anchorMs: (recovery.anchorMs as number | null) ?? null,
      baseHours: Number(recovery.baseHours) || 0,
      seenMilestones: Number(recovery.seenMilestones ?? -1),
    });
  }
  if (data.distractionsHelped && typeof data.distractionsHelped === 'object') {
    useDistractions.setState({
      helped: data.distractionsHelped as Record<string, number>,
    });
  }
  if (Array.isArray(data.wishlist) || Array.isArray(data.purchased)) {
    useWishlist.setState({
      items: (data.wishlist ?? []) as ReturnType<
        typeof useWishlist.getState
      >['items'],
      purchased: (data.purchased ?? []) as ReturnType<
        typeof useWishlist.getState
      >['purchased'],
    });
  }
  const logs = data.logs as Record<string, unknown[]> | undefined;
  if (logs) {
    const db = await getDb();
    for (const table of TABLES) {
      if (Array.isArray(logs[table])) await restoreTable(db, table, logs[table]);
    }
  }
  await useLogs
    .getState()
    .refreshToday()
    .catch(() => {});
}

/** Pick a JSON export from the file system and restore all data from it. */
export async function importAppData(): Promise<ImportOutcome> {
  try {
    const DocumentPicker = await import('expo-document-picker');
    const picked = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (picked.canceled || !picked.assets?.[0]) return 'cancelled';
    const FS = await import('expo-file-system/legacy');
    const json = await FS.readAsStringAsync(picked.assets[0].uri);
    const data = JSON.parse(json) as Record<string, unknown>;
    if (data?.app !== 'Wisp') return 'invalid';
    await restoreAppState(data);
    return 'imported';
  } catch (err) {
    logDev('utils/appData', err);
    return 'error';
  }
}

/** Clear every table and reset every store (leaves the app at onboarding). */
export async function wipeAppData(): Promise<void> {
  try {
    const db = await getDb();
    for (const table of TABLES) await db.runAsync(`DELETE FROM ${table}`);
  } catch (err) {
    logDev('utils/appData', err);
    /* db unavailable (web) — stores are still reset below */
  }
  useEconomy.getState().reset();
  useCompanion.getState().reset();
  usePlan.getState().clearPlan();
  useWishlist.getState().reset();
  useDistractions.getState().reset();
  useRecovery.getState().reset();
  useSettings.getState().reset();
  useSettings.getState().setOnboardingCompleted(false);
  await useLogs
    .getState()
    .refreshToday()
    .catch(() => {});
}
