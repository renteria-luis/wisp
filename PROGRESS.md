# PROGRESS

## Current phase: 2 — Onboarding & plan engine (status: done)

Completing onboarding now assigns a track and produces a persisted plan; the
Plan tab and Home reflect it. `lint`, `typecheck`, and **28 tests** pass; iOS and
web bundles export cleanly (all 27 routes prerender).

> **Phase order note:** the user asked to jump straight to Phase 2. Phase 2's plan
> engine is pure and its onboarding only needs lightweight persisted state, so it
> was built in full and the **store slice** it needs (Zustand + AsyncStorage) was
> folded in. The **SQLite/time-series data layer from Phase 1 is still deferred**
> and must be done before Phase 3 (logging/adherence needs it). See Next steps.

## Done (Phase 2)

- **Plan engine (pure, tested) — the product wedge:**
  - `src/engine/planEngine.ts` — `suggestTrack` (transparent, overridable scoring
    over consumption, readiness, dependence, preference) + `buildPlan` +
    `allowanceForDay`.
  - `src/engine/reduction.ts` — duration derivation and a `linear`/`easeOut`
    allowance curve (monotonic, integer, ends at 0). Tunable constants exported.
  - **23 engine tests** cover curve invariants, edge cases, and routing (incl. the
    Tiffani persona → gradual reduction).
- **Domain types** in `src/types/domain.ts`; pure date helpers in `src/utils/date.ts`.
- **State (Phase-1 slice):** `useSettings`, `usePlan`, `useOnboarding` Zustand
  stores persisted via AsyncStorage, plus a `useStoreHydrated` gate hook.
- **Onboarding flow** (`app/(onboarding)/`): welcome → consumption → profile →
  triggers → readiness → plan-preview. The preview runs the engine, shows the
  suggested track + rationale + schedule, allows a track override, and commits
  the plan + settings on confirm.
- **Gating:** `app/index.tsx` waits for hydration, then routes first-timers to
  onboarding and returning users to the tabs.
- **Plan tab** shows today's allowance, day-of-N, the week ahead (`AllowanceBars`),
  and the smoke-free target; **Home** greets by name and shows today's status.
- **UI primitives** in `src/components/ui/`: Button, Card, OptionChip, NumberField,
  Scale, ProgressDots, OnboardingStep, AllowanceBars.
- **i18n:** full EN/ES strings for onboarding + plan (locale parity test passes).
- Deps added: `zustand`, `date-fns`, `@react-native-async-storage/async-storage`.

## Next steps

- **Phase 1 (deferred slice) — SQLite time-series layer**, needed before Phase 3:
  1. `npx expo install expo-sqlite`; `npm i nanoid` (+ `react-native-get-random-values`).
  2. `src/data/schema.ts` + `src/data/db.ts` (init + migrations) for the §16 tables
     (`cigarette_log`, `craving_log`, `check_in`, `economy_ledger`; `plan_state`
     already lives in `usePlan`).
  3. Repositories in `src/data/repositories/` + a `__DEV__` dev-seed + tests.
- **Phase 3 — Adherence, re-planning & savings** (`adherence.ts`, `savings.ts`):
  7-day rolling average, win days, non-punitive re-plan, money saved. Build on the
  SQLite logs above.

## Notes / deviations from PROJECT.md

- **Phase 1 interleave** (above): SQLite/time-series layer deferred to before
  Phase 3; the persisted-store slice Phase 2 needed was built now.
- **Typed routes & cold typecheck:** `experiments.typedRoutes` is on for the dev
  experience. The generated `.expo/types/router.d.ts` is git-ignored and only
  refreshed by a running `expo start`; `expo export` reuses a cached route list.
  So `tsc`/CI run with it **absent** (→ permissive `Href`, stable and consistent).
  Route names are validated at runtime and by the bundler.
- **Spanish uses feminine forms** for the dedicatee persona (e.g. "lista",
  "juntas"). A public build localizes neutrally.
- _(Carried from Phase 0)_ Stack is Expo SDK 56 (vs PROJECT.md's pre-56
  assumptions); app display name inlined in `app.config.ts`; route files
  default-export while shared modules use named exports.
