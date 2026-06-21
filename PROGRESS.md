# PROGRESS

## Current phase: 4 — Companion, vitality & economy (status: done)

The companion now lives: a layered SVG creature whose expression/color/glow and
idle bob reflect vitality, an exponential smoke-free coin economy, and a Space
shop with daily-rotating cosmetics you can buy and equip. `lint`, `typecheck`,
and **58 tests** pass; iOS and web bundles export cleanly.

> **Phases done:** 0 (scaffold), 2 (onboarding & plan engine), 1 (data layer),
> 3 (adherence & savings), and now 4 (companion & economy). All merged to `main`,
> each runnable + tested. (Commits carry no the agent attribution, per request.)

## Done (Phase 4)

- **Vitality engine** (`src/engine/vitality.ts`, pure + 7 tests): 0–100 from
  recent smoking, the smoke-free stretch, and under-/over-target, mapped to four
  bands (exhausted/tired/okay/radiant).
- **Coin economy** (`src/engine/economy.ts`, pure + 6 tests): exponential
  smoke-free accrual `ratePerHour` (steps up ~15%/day, capped at 8×) integrated
  over elapsed time, plus discrete bonus constants.
- **Cosmetics** (`src/engine/cosmetics.ts`, pure + 4 tests): a 14-item catalog +
  a deterministic, date-seeded daily rotation (offline, identical per day).
- **Data:** migration **v2** adds `economy_ledger` (append-only) + its repo;
  `cigaretteLog` gains last-timestamp / count-since queries.
- **Stores:** `useEconomy` (balance + `accrueFromLogs`/`award`/`spend`,
  write-through to the ledger) and `useCompanion` (owned + equipped cosmetics),
  both AsyncStorage-persisted.
- **Companion** (`src/components/companion/Companion.tsx`): layered
  `react-native-svg` (glow, body, face, accessory, cheeks) with a Reanimated idle
  bob whose speed tracks the band; honors reduce-motion. Driven by `useVitality`.
- **Space tab:** the companion, coin balance, today's rotation + full shop;
  tapping buys (spend → own → equip) or equips, with `expo-haptics` feedback.
- **Wiring:** coins accrue on launch (`_layout`); a resisted craving awards a
  bonus (Log modal). Home now shows the live, vitality-driven companion.
- EN/ES strings for the shop (locale parity test passes).

## Next steps

- **Phase 5 — Craving toolkit & triggers/notifications.**
  1. Craving modal: breathing guide, "this passes in N min" timer, distraction.
  2. `src/engine/triggers.ts` → `src/notifications/scheduler.ts`: trigger windows
     → local `expo-notifications`; situational "I'm out / drinking" mode; daily
     rituals; quiet hours; re-schedule on launch/settings change.
  - DoD: panic button works; scheduled notifications fire; situational mode raises support.

## Notes / deviations from PROJECT.md

- **Inventory in Zustand** (`useCompanion`), not the SQLite `inventory` table from
  §16 — it's a small bounded set; only the unbounded `economy_ledger` uses SQLite.
- **Coin accrual is retroactive** on launch (rewards smoke-free time while the app
  was closed) and time-based off the last cigarette, which also covers the
  reduction-track "gaps between cigarettes" reward with one mechanism.
- _(Carried)_ Expo SDK 56; `plan_state`/settings in Zustand; repos validated via
  bundling + dev-seed (no SQLite Jest mock); typed routes on but `tsc`/CI run with
  `.expo/types` absent; Spanish feminine for the dedicatee; route files
  default-export, shared modules named.
