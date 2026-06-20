# PROGRESS

## Current phase: 1 — Data layer (status: done)

The deferred SQLite/time-series layer is now in place; the Log modal records
cigarettes and resisted cravings, and Home reflects today's logged count vs the
plan's allowance. `lint`, `typecheck`, and **31 tests** pass; iOS and web bundles
export cleanly.

> **Phases done so far:** 0 (scaffold), 2 (onboarding & plan engine), and now the
> deferred 1 (data layer). The jump to Phase 2 left Phase 1's SQLite work for
> later — this closes it, so Phase 3 (adherence/savings) is unblocked.

## Done (Phase 1 — data layer)

- **expo-sqlite** added (config plugin + Metro `wasm` asset ext for web).
- **Schema & migrations** (`src/data/schema.ts`, `db.ts`): versioned via
  `PRAGMA user_version`; tables `cigarette_log`, `craving_log`, `check_in`. The DB
  singleton **lazy-imports** expo-sqlite so importing the data layer never pulls
  the native module (keeps web prerender + tests clean).
- **Repositories** (`src/data/repositories/`): cigarette log (add, count-by-date,
  daily counts), craving log (add, resisted-count), check-in (upsert/get).
- **`useLogs` store**: reactive cache over SQLite; `init` on launch, `logCigarette`
  / `logResistedCraving`, and today's counts. Resilient if SQLite is unavailable.
- **Log modal** (`app/log.tsx`): smoked vs resisted, optional trigger + intensity,
  writes to SQLite. **Home** shows today's logged count vs allowance + a Log action.
- **Dev-seed** (`src/data/devSeed.ts`, `__DEV__`-guarded) for ~2 weeks of sample logs.
- **Pure series helper** `densifyDailyCounts` (sparse → dense daily series) with
  **3 unit tests** — the dense input Phase 3 adherence consumes.
- EN/ES strings for logging (locale parity test still passes).

## Next steps

- **Phase 3 — Adherence, re-planning & savings.**
  1. `src/engine/adherence.ts` — 7-day rolling average (primary metric), win-days,
     trend, and **non-punitive** re-plan rules (flatten/extend when over;
     offer-only acceleration when comfortably under). Consume
     `densifyDailyCounts(getDailyCigaretteCounts(...))`.
  2. `src/engine/savings.ts` — price-per-cig, cigarettes avoided, money saved.
  3. Wire trend + savings into Progress; trigger re-plan and persist to `usePlan`.
  4. Thorough engine tests (slip handling never zeroes history).

## Notes / deviations from PROJECT.md

- **Repositories aren't unit-tested against SQLite**: expo-sqlite is native and
  has no functional Jest mock, so repos (thin SQL) are validated by the bundling
  app + dev-seed, while the **pure aggregation** they feed is unit-tested. Real
  integration tests would need a dev build or a SQLite shim.
- **`plan_state` lives in Zustand** (`usePlan`), not the SQLite table sketched in
  §16 — the active plan is a single small record better suited to key-value
  persistence. The SQLite schema covers the genuine time-series tables.
- **Web SQLite degrades gracefully**: expo-sqlite web needs cross-origin isolation
  (SharedArrayBuffer) to actually run; `useLogs.init` catches failures so the web
  preview still renders (logging persists on device, the real target).
- _(Carried)_ Expo SDK 56 stack; app name inlined in `app.config.ts`; typed routes
  on but `tsc`/CI run with `.expo/types` absent (permissive `Href`); Spanish uses
  feminine forms for the dedicatee; route files default-export, shared modules named.
