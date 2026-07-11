import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { getLastCigaretteTimestamp } from '@/data/repositories/cigaretteLog';
import {
  addLedgerEntry,
  type LedgerReason,
} from '@/data/repositories/economyLedger';
import { accrueCoins, recoveryMultiplier } from '@/engine/economy';
import { liveRecoveryHours, reachedCount } from '@/engine/health';
import { useRecovery } from '@/store/useRecovery';
import type { Plan } from '@/types/domain';
import { logDev } from '@/utils/logger';

const HOUR_MS = 3_600_000;

interface EconomyState {
  /** Coins in the wallet (spendable). */
  balance: number;
  /** Coins earned passively but not yet claimed into the wallet. */
  pending: number;
  /** ISO of the last time smoke-free coins were accrued. */
  lastAccrualAt: string | null;

  /** Grant a discrete bonus straight to the wallet (action reward). */
  award: (delta: number, reason: LedgerReason) => Promise<void>;
  /** Spend coins; returns false (no-op) if the balance is insufficient. */
  spend: (amount: number, reason?: LedgerReason) => Promise<boolean>;
  /** Move pending coins into the wallet; returns the amount claimed. */
  claim: () => Promise<number>;
  /** Accrue exponential smoke-free coins into the pending pool, scaled by how
   *  far along the recovery milestones the user is. */
  accrueFromLogs: (plan: Plan | null) => Promise<void>;
  /** Dev / God-mode setters. */
  setBalance: (balance: number) => void;
  setPending: (pending: number) => void;
  reset: () => void;
}

export const useEconomy = create<EconomyState>()(
  persist(
    (set, get) => ({
      balance: 0,
      pending: 0,
      lastAccrualAt: null,

      award: async (delta, reason) => {
        const balance = Math.max(0, Math.round(get().balance + delta));
        set({ balance });
        try {
          await addLedgerEntry({
            delta: Math.round(delta),
            reason,
            balanceAfter: balance,
          });
        } catch (err) {
          logDev('store/useEconomy', err);
          /* ledger is best-effort */
        }
      },

      spend: async (amount, reason = 'purchase') => {
        if (get().balance < amount) return false;
        const balance = get().balance - amount;
        set({ balance });
        try {
          await addLedgerEntry({
            delta: -amount,
            reason,
            balanceAfter: balance,
          });
        } catch (err) {
          logDev('store/useEconomy', err);
          /* ledger is best-effort */
        }
        return true;
      },

      claim: async () => {
        const amount = Math.round(get().pending);
        if (amount <= 0) {
          set({ pending: 0 });
          return 0;
        }
        const balance = Math.round(get().balance + amount);
        set({ balance, pending: 0 });
        try {
          await addLedgerEntry({
            delta: amount,
            reason: 'claim',
            balanceAfter: balance,
          });
        } catch (err) {
          logDev('store/useEconomy', err);
          /* ledger is best-effort */
        }
        return amount;
      },

      accrueFromLogs: async (_plan) => {
        try {
          const now = Date.now();
          const lastCig = await getLastCigaretteTimestamp();
          const rec = useRecovery.getState();
          // Streak/base-rate anchor: the last cigarette, or the journey anchor
          // (seeded to "now" on first launch) if none logged — never the plan's
          // calendar date parsed as UTC midnight, which gave a fresh account a
          // multi-hour head start of coins.
          const anchor = rec.anchorMs ?? now;
          const streakStartMs = lastCig ? new Date(lastCig).getTime() : anchor;
          const last = get().lastAccrualAt;
          const lastMs = last ? new Date(last).getTime() : streakStartMs;
          const accrueFromMs = Math.max(lastMs, streakStartMs);

          const elapsedHours = (now - accrueFromMs) / HOUR_MS;
          if (elapsedHours <= 0) {
            set({ lastAccrualAt: new Date(now).toISOString() });
            return;
          }

          // The further along the recovery milestones, the higher the rate.
          const recoveryHours = liveRecoveryHours(rec.baseHours, anchor, now);
          const multiplier = recoveryMultiplier(reachedCount(recoveryHours));

          const streakStartHours = (accrueFromMs - streakStartMs) / HOUR_MS;
          const coins = Math.round(
            accrueCoins(streakStartHours, elapsedHours) * multiplier,
          );
          set({
            pending: Math.round(get().pending + Math.max(0, coins)),
            lastAccrualAt: new Date(now).toISOString(),
          });
        } catch (err) {
          logDev('store/useEconomy', err);
          /* SQLite unavailable (e.g. web prerender) — skip accrual */
        }
      },

      setBalance: (balance) =>
        set({ balance: Math.max(0, Math.round(balance)) }),
      setPending: (pending) =>
        set({ pending: Math.max(0, Math.round(pending)) }),
      reset: () => set({ balance: 0, pending: 0, lastAccrualAt: null }),
    }),
    {
      name: 'wisp-economy',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (s) => ({
        balance: s.balance,
        pending: s.pending,
        lastAccrualAt: s.lastAccrualAt,
      }),
    },
  ),
);
