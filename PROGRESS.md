# PROGRESS

## Current phase: 0 — Scaffold & foundations (status: done)

Wisp boots to a placeholder Home; `lint`, `typecheck`, and `test` all pass; the
iOS and web bundles export cleanly. The foundation for Phase 1 is in place.

## Done

- **Toolchain:** Node was not preinstalled — installed Node 22 LTS via `nvm` and
  symlinked `node`/`npm`/`npx` into `~/.local/bin` (already on PATH).
- **App scaffold:** Expo **SDK 56** (React 19.2, RN 0.85.3, expo-router 56) on a
  feature branch, reshaped from the official template into PROJECT.md §15 layout
  (top-level `app/` + full `src/` skeleton).
- **TypeScript (strict):** `@/*` → `src/*` path alias, plus
  `noUncheckedIndexedAccess` and `resolveJsonModule`. `tsc --noEmit` clean.
- **Styling:** NativeWind v4 + Tailwind v3 wired (babel `jsxImportSource`, metro
  `withNativeWind`, `src/global.css`). Design tokens in `src/theme/tokens.ts`
  share a single `palette.json` with `tailwind.config.js` so they never drift.
- **Routing/UI:** root `Stack` + `(tabs)` (Home/Plan/Progress/Space) + an
  `(onboarding)` group + modal routes (log/craving/about/settings). Placeholder
  Home renders the companion greeting through i18n + personal config; `index.tsx`
  redirects to the tabs (onboarding gate arrives in Phase 2).
- **i18n:** i18next + react-i18next + expo-localization, EN default / ES, with a
  locale key-parity test. All visible strings come from locale JSON.
- **Personal touches:** `src/personal/personal.config.ts` holds the dedication +
  easter-egg text (English, config-driven per §11).
- **Quality tooling:** ESLint (eslint-config-expo flat config) clean, Prettier
  (+ tailwind class sorting) clean, Jest (jest-expo) — **5 tests passing**.
- **CI:** `.github/workflows/ci.yml` runs install → lint → typecheck → test on
  Node 22 for pushes to `main` and PRs.
- **Docs:** portfolio-oriented `README.md`.
- **DoD verified:** `expo export` succeeds for **iOS** (Hermes bundle, fonts +
  assets) and **web** (all 17 routes prerendered).

## Next steps

- **Phase 1 — Data layer & models.** Concretely:
  1. Install: `npx expo install expo-sqlite @react-native-async-storage/async-storage`
     and `npm i zustand nanoid date-fns`.
  2. `src/data/schema.ts` + `src/data/db.ts` — expo-sqlite init + migrations for
     the §16 tables (`cigarette_log`, `craving_log`, `check_in`, `plan_state`,
     `inventory`, `economy_ledger`).
  3. Repositories in `src/data/repositories/`, shared types in `src/types/`.
  4. Zustand stores in `src/store/` (`useSettings`, `usePlan`, `useCompanion`,
     `useEconomy`) with AsyncStorage persistence.
  5. A `__DEV__`-only dev-seed util; repository unit tests.
  - DoD: can log/read cigarette, craving, check-in; tests pass.

## Notes / deviations from PROJECT.md

- **Stack versions:** PROJECT.md predates SDK 56. Actual install is Expo SDK 56 /
  React 19.2 / RN 0.85.3 / expo-router 56 / NativeWind 4.2 (Tailwind 3.4). Every
  chosen library remains **Expo Go-compatible**, as required by §14.
- **App display name is inlined in `app.config.ts`** (`'Wisp'`) instead of being
  imported from `personal.config.ts`: Expo's config loader transpiles only
  `app.config.ts` and cannot resolve relative `.ts` imports at config-eval time.
  `personal.appName` stays the runtime/UI source of truth — keep the two in sync
  (noted in `app.config.ts`). The "rebrand from one file" intent is preserved for
  in-app text.
- **Export convention:** route files (`app/`) default-export (Expo Router
  requirement); shared components and data modules use **named** exports (keeps
  `import/no-named-as-default` happy and reads consistently).
- **Trimmed three dev-build-only template deps** (`@expo/ui`,
  `expo-glass-effect`, `expo-symbols`) to stay strictly Expo Go-compatible, and
  dropped the template's `use-color-scheme.web.ts` (web SSR hydration helper,
  unneeded for an iOS-first app; it also tripped a React Compiler lint rule).
