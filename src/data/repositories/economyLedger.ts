/** Coin economy ledger repository (PROJECT.md §7.3). Append-only. */
import { getDb } from '../db';

export type LedgerReason =
  | 'accrual'
  | 'check_in'
  | 'resisted_craving'
  | 'win_day'
  | 'milestone'
  | 'purchase';

export interface LedgerRow {
  id: number;
  timestamp: string;
  delta: number;
  reason: string;
  balance_after: number;
}

export async function addLedgerEntry(entry: {
  delta: number;
  reason: LedgerReason;
  balanceAfter: number;
  timestamp?: string;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO economy_ledger (timestamp, delta, reason, balance_after) VALUES (?, ?, ?, ?)',
    entry.timestamp ?? new Date().toISOString(),
    entry.delta,
    entry.reason,
    entry.balanceAfter,
  );
}

export async function getRecentLedger(limit = 20): Promise<LedgerRow[]> {
  const db = await getDb();
  return db.getAllAsync<LedgerRow>(
    'SELECT * FROM economy_ledger ORDER BY id DESC LIMIT ?',
    limit,
  );
}
