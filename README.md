# Wisp 🌫️

> A warm, on-device quit-smoking companion that adapts to _any_ smoker — routing each person to a **cold-turkey** or **gradual-reduction** track inside a guided, CBT-informed program, wrapped in a gentle Finch-style companion that reflects your progress.

Wisp is a cross-platform mobile app (iOS-first) built entirely on Linux with Expo + React Native. It is **100% on-device**: no account, no backend, no telemetry. The "personalized plan" is computed by a deterministic, fully-tested rule engine — never an LLM at runtime — so it is private, offline, and explainable.

---

## Why this project

Most quit-smoking apps fail at one of two things; Wisp is built to get both right:

1. **A guided program, not a passive dashboard.** The app actively walks you through a structured, adaptive plan instead of dumping stats and walking away.
2. **It adapts to the type of smoker.** A short onboarding routes each person to a **Cold Turkey** or **Gradual Reduction** track based on consumption, dependence, and readiness — rather than imposing a single philosophy.

A third, quieter differentiator is **warmth**: a customizable companion whose wellbeing visibly reflects your behavior, making progress _felt_ rather than charted.

## What it demonstrates (portfolio view)

- **Clean architecture with a pure core.** All product logic lives in a pure, UI-free, unit-tested TypeScript engine (`src/engine/`). Data → state → engine → UI is a strict one-way flow.
- **Deterministic product logic over an LLM.** Track assignment, reduction curves, adherence/re-planning, an exponential coin economy, vitality, savings, and a health timeline are all rule-based and testable.
- **Thoughtful, non-punitive UX.** Progress is anchored on a 7-day trend, not a fragile streak — a slip never wipes your history.
- **Modern RN tooling end-to-end.** Expo Router, NativeWind, Zustand, expo-sqlite, custom SVG/Reanimated charts, local notifications, i18n (EN/ES), strict TypeScript, Jest, and CI.
- **Privacy as a feature.** "Data Not Collected" — everything stays on the device.

## Tech stack

Expo (managed) · React Native · TypeScript (strict) · Expo Router · NativeWind v4 · Zustand · expo-sqlite · expo-notifications (local) · react-native-svg + Reanimated · expo-haptics · i18next · Jest · EAS + GitHub Actions.

> Designed to run in **Expo Go** so the whole app can be built and used for free on a real iPhone during development — no Mac required.

## Getting started

```bash
npm install        # install dependencies
npm start          # start the Expo dev server (scan the QR with Expo Go)
npm run web        # or preview in the browser
```

Quality gates:

```bash
npm run lint       # ESLint (eslint-config-expo)
npm run typecheck  # tsc --noEmit (strict)
npm test           # Jest (engine + unit tests)
```

## Project structure

```
app/      Expo Router screens (onboarding, tabs, modals)
src/
  engine/        pure, tested product logic (no UI, no I/O)
  data/          expo-sqlite schema + repositories
  store/         Zustand stores
  components/     companion, charts, craving toolkit, UI
  theme/          design tokens (shared with Tailwind)
  i18n/           en / es locales
  notifications/  local notification scheduling
  personal/       personal.config.ts (dedication + easter eggs)
```

The single source of truth for scope and architecture is **[PROJECT.md](./PROJECT.md)**; live status lives in **[PROGRESS.md](./PROGRESS.md)**.

## Roadmap

Built in token-safe phases — every phase ends runnable, tested, and committed.

- **Phase 0 — Scaffold & foundations** ✅
- **Phase 1 — Data layer & models** ✅
- **Phase 2 — Onboarding & plan engine** ✅
- **Phase 3 — Adherence, re-planning & savings** ✅
- **Phase 4 — Companion, vitality & economy** ✅
- **Phase 5 — Craving toolkit & triggers/notifications** ✅
- **Phase 6 — Charts & health timeline** ✅
- **Phase 7 — i18n, personal touches & polish** ✅ _(settings, export/reset, mood check-in, easter eggs, dark mode)_
- **Phase 8 — Release prep (TestFlight)** ⏳ _(next — needs an Apple Developer account)_

## Privacy

No account, no cloud, no analytics. All data stays on your phone, with in-app **export** and **reset**. The health timeline shows standard recovery information and is **not medical advice**.

---

_Made with ♥ — a personal project, generalizable to any smoker._
