# PROGRESS

## Current phase: 5 — Craving toolkit & triggers/notifications (status: done)

The panic button is real: a craving modal with an animated breathing guide, a
"this passes in ~3 min" timer, and rotating distractions; plus local trigger
notifications, a situational "I'm out / drinking" support burst, and quiet hours.
`lint`, `typecheck`, and **63 tests** pass; iOS and web bundles export cleanly
(SDK 54 / Expo Go).

> **Phases done:** 0 (scaffold), 2 (onboarding & plan engine), 1 (data layer),
> 3 (adherence & savings), 4 (companion & economy), and now 5 (craving &
> notifications). All merged to `main`, each runnable + tested. (Commits carry no
> the agent attribution, per request.)

## Done (Phase 5)

- **Craving toolkit** (`src/components/craving/`, `app/craving.tsx`): a tabbed
  panic button — `BreathingGuide` (inhale/hold/exhale circle, haptic per phase),
  `CravingTimer` (3-min SVG ring countdown), `Distraction` (rotating tips). An
  "I resisted" action logs the craving + awards coins. Reached from a Home button.
- **Triggers engine** (`src/engine/triggers.ts`, pure + 5 tests): default per-
  category windows → daily notification specs, overnight-aware quiet-hours
  filtering, and the situational support cadence.
- **Scheduler** (`src/notifications/scheduler.ts`): local `expo-notifications`
  (lazy-imported), permission request, daily trigger nudges, and the situational
  burst — all deep-linking to `/craving`.
- **Settings + wiring:** `useSettings` gains quiet hours, a notifications flag,
  and `situationalUntil`. Permission is asked **after onboarding** (in context);
  schedules refresh on launch; tapping a notification opens the craving toolkit;
  a Home toggle starts situational support.
- EN/ES strings for the toolkit + notifications (locale parity test passes).

## Next steps

- **Phase 6 — Charts & health timeline.**
  1. Custom animated SVG charts (`src/components/charts/`): cigarette trend,
     savings over time, allowance vs actual — built on react-native-svg +
     Reanimated.
  2. `src/engine/health.ts`: the recovery-milestone dataset (§6.7), personalized
     framing (gender/age/years), anchored from quit/zero date; brief "not medical
     advice" note.
  - DoD: Progress shows animated charts + the health timeline.

## Notes / deviations from PROJECT.md

- **Notifications are local-only** (as designed, §9) and run in Expo Go on iOS.
  Trigger **time windows use sensible defaults per category** (precise per-window
  config — e.g. Tiffani's 15/15/30 breaks — is a Phase-7 settings screen);
  quiet-hours defaults to 22:00–07:00.
- **Inventory in Zustand** (`useCompanion`), not the SQLite `inventory` table from
  §16; only the unbounded `economy_ledger` uses SQLite.
- **Retargeted to Expo SDK 54** so the app runs in the released Expo Go (expo 54,
  react 19.1, RN 0.81, expo-router 6, reanimated 4.1); `ThemeProvider` from
  `@react-navigation/native`.
- _(Carried)_ `plan_state`/settings in Zustand; repos validated via bundling +
  dev-seed (no SQLite Jest mock); typed routes on but `tsc`/CI run with
  `.expo/types` absent; Spanish feminine for the dedicatee; route files
  default-export, shared modules named.
