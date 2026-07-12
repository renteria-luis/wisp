# PROGRESS

## Current phase: post-Phase-7 — feature-complete v1 (status: done, pending release)

Phases **0–7 are done**, and a large body of work landed after them (below).
`lint`, `typecheck` and **104 tests** pass; the iOS and web bundles export
cleanly on **Expo SDK 54 / Expo Go**. The app is functionally finished: what is
left is release, not features.

> **Phases done:** 0 (scaffold), 1 (data layer), 2 (onboarding & plan engine),
> 3 (adherence & savings), 4 (companion & economy), 5 (craving & notifications),
> 6 (charts & health timeline), 7 (i18n, personal touches, polish).
> All merged to `main`.

## Done since Phase 7 (outside the original roadmap)

- **Recovery model + health milestones.** A running recovery score and **30
  cited milestones** from 20 minutes to 15 years, personalised by profile.
- **Wishlist economy.** Add things you actually want, then buy them with coins
  earned from real savings; purchased items become "treats" you can look back on.
- **Cigarette history.** Day-grouped log with a per-day filter, a week/month/all
  trend range, and **manual backfill** for a day you forgot — with the whole
  progress view live-refreshing after a backfill.
- **Distraction library** that records which distractions actually helped you,
  and surfaces those first.
- **Guided tour.** A **16-step tour that runs on a throwaway sandbox world** —
  the user really taps Log, really sees the cigarette land in the chart, really
  resists a craving, all on live UI without touching one byte of real data. Each
  step declares the one route it lives on; the controller reconciles the real
  route against it and steers back if anything drifts, and the overlay refuses
  to spotlight anything off its own screen.
- **Celebrations**, an in-app splash on cold start, an ebooks/reading screen, and
  a **God Mode** debug panel (`__DEV__` only).
- **Themes:** light, dark and a vivid palette, following the system by default.
- **Feedback layer** (`src/utils/feedback.ts`): every haptic routed through one
  module, with a Settings switch. No sound anywhere — see PROJECT.md §22 for why.
- **Companion sprite system** with several unlockable characters and accessories.

## Next steps

- **Phase 8 — Release prep.** Two paths, both open:
  1. **Free / sideload** — `docs/SIDELOADING.md` (GitHub Actions builds an
     unsigned IPA; SideStore signs it on-device with a free Apple Account). The
     workflow already exists and works.
  2. **Paid ($99/yr)** — `eas.json` profiles → EAS build → **TestFlight**. No
     weekly refresh, no VPN. This is the cleaner long-term path.
- Add the four screenshots the README embeds (`docs/screenshots/`).
- Companion art: finish the AI-generated originals (see the note below).

## Notes / deviations from PROJECT.md

- **Companion art is a work in progress.** The sprite system is built and
  driven by vitality; the original characters still need a final art pass
  (borderless regeneration plus a ground shadow). Not a blocker.
- **Trigger windows use per-category defaults**; a precise per-window editor
  (e.g. two 15-minute breaks and one 30-minute break in a shift) is still
  future polish.
- **Theme is a real setting now** (system / light / dark / vivid), not just
  "follows the system" as originally specced.
- _(Carried)_ Notifications are local-only; inventory lives in Zustand, not the
  SQLite `inventory` table (only `economy_ledger` uses SQLite); typed routes are
  on but `tsc`/CI run with `.expo/types` absent; charts are hand-built with
  SVG + Reanimated; route files default-export, shared modules are named.

## Image assets — read before making the repo public

`assets/` contains third-party character artwork used for a **private, personal
build**. It is excluded from the MIT licence (see `LICENSE`), but a licence note
is not a licence to redistribute: if this repo goes public as a portfolio piece,
either remove that artwork from the public history or keep the repo private.
