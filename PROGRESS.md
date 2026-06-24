# PROGRESS

## Current phase: 7 — i18n, personal touches & polish (status: done)

Wisp now feels like a finished v1: a full Settings screen, on-device data
export/erase, a daily mood check-in, the personal dedication + easter eggs, a
"what you could buy instead" savings goal, and app-wide dark mode. `lint`,
`typecheck`, and **71 tests** pass; iOS and web bundles export cleanly
(SDK 54 / Expo Go). Only **Phase 8 (release prep)** remains.

> **Phases done:** 0 (scaffold), 1 (data layer), 2 (onboarding & plan engine),
> 3 (adherence & savings), 4 (companion & economy), 5 (craving & notifications),
> 6 (charts & health timeline), 7 (polish). Plus post-roadmap work: an SDK-54
> retarget, a UX batch (claimable pending coins, cosmetic preview, God Mode),
> cigarette source/manner logging (shared/gifted), and unlockable companion
> characters. All merged to `main`; commits carry no the agent attribution.

## Done (Phase 7)

- **Settings** (`app/settings.tsx`, reached via the gear in Space): edit your
  name + companion name, profile (gender/age/years), pricing/currency,
  notification toggle + quiet-hours steppers (reschedules on change), and a
  language override (auto/en/es) applied on launch.
- **Data ownership** (`src/utils/appData.ts`, §12): one-tap **export** of every
  store + SQLite table to a shared JSON file, and a confirmed **erase all**.
  Native modules (`expo-file-system`/`expo-sharing`) are lazy-imported.
- **Daily mood check-in** (`app/checkin.tsx`): a warm 5-mood ritual that writes
  to `check_in` and awards coins once per day.
- **Personal touches** (`personal.config.ts`, §11): the About screen (dedication,
  version, privacy, credits) plus all four easter eggs — companion long-press
  heart burst, one-time savings note, hidden Space star, optional special-date
  greeting.
- **Savings goals** (§6.8): a "what you could buy instead" next-goal bar in the
  Progress savings card.
- **Dark mode** (§17): `dark:` variants across the shared components and every
  screen/chart; follows the system appearance.
- EN/ES strings for all of the above (locale-parity test passes).

## Next steps

- **Phase 8 — Release prep (optional, needs a $99 Apple Developer account).**
  1. `eas.json` profiles (dev/preview/production) + `app.config.ts` bundle id,
     name, icon, splash, min iOS 16.
  2. EAS dev build → **TestFlight** submit (both iPhones).
  3. Optional StoreKit wiring for the existing `isPremium` flag (forced open).
  - DoD: an installable TestFlight build on both phones.

## Notes / deviations from PROJECT.md

- **Companion characters are placeholder SVG silhouettes.** The user wants to
  replace them with detailed, Secret-style **AI-generated original** art later
  (e.g. Niji Journey / Recraft-to-SVG), swapped per vitality band. Tracked as a
  visual follow-up, not a blocker.
- **Dark mode follows the system** (no in-app Light/Dark override toggle yet).
- **Trigger windows use sensible per-category defaults**; a precise per-window
  editor (e.g. Tiffani's 15/15/30 breaks) is still future polish.
- _(Carried)_ Notifications are local-only (Expo Go iOS); inventory lives in
  Zustand, not the SQLite `inventory` table; only `economy_ledger` uses SQLite;
  retargeted to **Expo SDK 54**; typed routes on but `tsc`/CI run with
  `.expo/types` absent; SVG/Reanimated charts; Spanish feminine for the
  dedicatee; route files default-export, shared modules named.
