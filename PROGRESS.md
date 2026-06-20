# PROGRESS

## Current phase: 3 — Adherence, re-planning & savings (status: done)

Logging now drives a real Progress screen: 7-day trend, win-days/streak, money
saved, and a non-punitive re-plan banner. `lint`, `typecheck`, and **45 tests**
pass; iOS and web bundles export cleanly.

> **Phases done:** 0 (scaffold), 2 (onboarding & plan engine), 1 (data layer),
> and now 3 (adherence & savings). Phase order was shuffled at the user's request;
> all phases are merged to `main`, each runnable + tested.

## Done (Phase 3)

- **Adherence engine** (`src/engine/adherence.ts`, pure + 6 tests): 7-day rolling
  average as the **primary** metric, `winDay`, streak/win-day counters, and
  `recommendReplan` — eases when the trend stays over allowance for `OVER_DAYS`,
  offers (not forces) acceleration when comfortably under, and **absorbs a single
  slip** without punishing (tested explicitly).
- **Re-plan builder** (`planEngine.rebuildReductionPlan`, +1 test): re-anchors a
  reduction plan at the recent trend and flattens/extends (ease) or shortens
  (accelerate) — logs/history untouched.
- **Savings engine** (`src/engine/savings.ts`, pure + 5 tests): price-per-cig,
  cigarettes avoided (never negative/day), money saved, and a cumulative series.
- **Progress screen** (`app/(tabs)/progress.tsx`) via `useProgressData` (reads the
  logs for the plan span, densifies, derives all metrics, refetches on new logs):
  trend + last-14-days bars, streak/win-days (or smoke-free days for cold turkey),
  money saved + cigarettes avoided, and a gentle ease/accelerate banner that
  applies the re-plan to `usePlan`.
- EN/ES progress strings (locale parity test passes).
- **Permissions:** added a safe allowlist to `.the agent/settings.local.json` (npm,
  npx, git non-destructive, tsc, jest, prettier, project edits) so routine ops
  don't prompt; destructive/outward ops still ask.

## Next steps

- **Phase 4 — Companion, vitality & economy.**
  1. `src/engine/vitality.ts` — 0–100 vitality from recent behavior (penalty/bonus
     over a short window) → companion bands (exhausted/tired/okay/radiant).
  2. `src/engine/economy.ts` — exponential smoke-free coin accrual (capped) +
     discrete bonuses; `src/engine/cosmetics.ts` incl. daily-rotating set (seeded
     by date). Add `economy_ledger` + `inventory` SQLite tables (migration v2).
  3. Companion SVG component (layered, vitality-driven) + Space tab + cosmetics
     shop/inventory; haptics. Stores: `useCompanion`, `useEconomy`.
  - DoD: companion reflects vitality; coins accrue; buy/equip cosmetics.

## Notes / deviations from PROJECT.md

- **Re-plan UX:** for v1 the ease/accelerate suggestion surfaces as a banner the
  user taps to apply (rather than silent auto-replanning) — clearer and keeps the
  user in control. The trigger logic itself is the tested engine.
- _(Carried)_ Expo SDK 56; `plan_state`/settings in Zustand, time-series in SQLite;
  repositories validated via bundling + dev-seed (no SQLite Jest mock); typed
  routes on but `tsc`/CI run with `.expo/types` absent; Spanish feminine for the
  dedicatee; route files default-export, shared modules named.
