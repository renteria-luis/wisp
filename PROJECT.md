# PROJECT.md — Wisp

> **Working title:** `Wisp` (a wisp of smoke fading away; also the companion's default name). Placeholder — change it in `app.config.ts` and `personal.config.ts`.
>
> **One-line pitch:** A warm, on-device quit-smoking companion that adapts to _any_ smoker — routing each person to either a cold-turkey track or a gradual-reduction track inside a guided, CBT-informed program — wrapped in a Finch-style emotional companion that reflects your progress.

This document is the single source of truth for the project. **Read it fully, then `PROGRESS.md`, before changing anything.** Do not deviate from the architecture decisions here without flagging them.

---

## 1. Vision & differentiators

Most quit-smoking apps fail at one of two things, and almost none get both right. Those two things are our entire reason to exist:

- **(a) A guided program, not a passive dashboard.** The app actively walks the user through a structured, sequential plan (the evidence says structured programs beat open-ended feature bags). It tells them what today looks like, adapts tomorrow based on what happened, and never just dumps stats and walks away.
- **(b) Adapts to the type of smoker.** After a short onboarding, the engine assigns one of two tracks — **Cold Turkey** or **Gradual Reduction** — based on consumption, dependence, and readiness, instead of imposing a single philosophy. This is the core product wedge.

A third, quieter differentiator: **warmth.** Almost every quit app is clinical and cold. Wisp borrows the gentle, low-pressure, companion-driven feel of Finch (the self-care app), which is sticky and kind. The companion is the emotional core.

**Non-negotiable principles:**

- **100% on-device. No account, no cloud, no backend, no telemetry.** All data stays on the phone. This is simultaneously a real user preference, a marketing angle, and an architecture simplifier.
- **Offline-first.** Everything works with no network.
- **Deterministic, explainable logic.** The "personalized plan" is computed by a rule engine, never an LLM at runtime (see §6). No hallucinations, fully testable.
- **Non-punitive by design.** Slips never wipe progress. The primary metric is the _trend_, not a fragile streak (see §6.3).

---

## 2. Target user (real persona)

Built first for one real user, then generalizable.

- **Primary user:** Tiffani — light smoker (~3–4 cigarettes/day). Likely routed to the **Gradual Reduction** track. Loves Finch (customizing her avatar and home, daily encouragement, hugs). **Plays muted** → no sound/voice in v1; use haptics for feedback instead.
- **Her known triggers (seed the trigger system with these as defaults/examples):**
  - Work breaks at Starbucks: **3 breaks/shift — two of 15 min, one of 30 min** (times configurable in onboarding).
  - **Commute:** on the way to the bus stop / while waiting for the bus.
  - **Alcohol / social:** smokes when drinking.
- The app must still generalize: any smoker, any consumption level, either track.

---

## 3. Product scope — v1 features

1. **Adaptive onboarding** → assigns a track and builds a personalized plan.
2. **Two tracks from v1:** Cold Turkey + Gradual Reduction.
3. **Rule-based plan engine** with adaptive re-planning (trend-based, non-punitive).
4. **Companion** (Finch-style): customizable look + a personal space/room, reflects health/mood (tired/sad ↔ radiant), daily rituals (morning greeting, mood check-in), hugs/encouragement, supportive on slips.
5. **Coin economy** that rewards smoke-free _duration_ (exponential, see §7.3) plus discrete actions; spent on cosmetics.
6. **Cosmetics** including a **daily-rotating** set (colors/designs change each day).
7. **Craving toolkit** ("panic button"): guided breathing, "this craving passes in N min" timer, distraction.
8. **Trigger system:** scheduled **local** notifications around the user's trigger windows + a situational "I'm out / drinking" mode that raises support.
9. **Money saved tracker:** personalizable by brand, after-tax pack price, pack size; animated charts; "what you could buy instead."
10. **Health timeline:** personalizable by gender, age, smoking frequency, years smoking, start date.
11. **Progress views:** trend-based metrics, animated charts, streak + under-target win days.
12. **i18n:** English (default) + Spanish.
13. **Personal touches:** "Made with ♥ for Tiffani" dedication + 2–3 hidden easter eggs (driven by `personal.config.ts`).
14. **Monetization scaffold** (inactive in v1): a single `isPremium` flag; full app is free for us (see §13).

**Explicitly out of scope for v1** (tracked in §22): sound/voice, community/social, remote push, any backend, real In-App Purchase wiring, ML.

---

## 4. UX flows (high level)

### 4.1 Onboarding (file-based, `app/(onboarding)/`)

1. **Welcome** — name + short framing.
2. **Consumption** — cigarettes/day, pack price (after-tax), cigarettes per pack, currency.
3. **Profile** — gender, age, years smoking, started-smoking date (for the health timeline).
4. **Triggers** — pick trigger categories (work breaks, commute, alcohol/social, after meals, stress, boredom…) and, for time-bound ones, configure windows (e.g., Tiffani's 15/15/30 breaks, commute time).
5. **Readiness** — 2–3 questions (confidence, preference for quitting outright vs cutting down). Combined with consumption + dependence to choose the track. Let the user override the suggested track.
6. **Plan preview** — shows assigned track, the plan/schedule, target date, and the companion greeting the user by name.

Persist onboarding completion; `app/index.tsx` redirects to onboarding or the tabs accordingly.

### 4.2 Main app — tabs (`app/(tabs)/`)

- **Home** — the companion (reflecting current vitality), today's status (track-specific: "smoke-free for X" or "today's allowance: N, so far: M"), coin balance, quick actions (Log, Craving, Check-in).
- **Plan** — today's target/allowance, the schedule/curve, re-plan status, next milestone.
- **Progress** — trend chart, money saved chart + total, health timeline, streak + win-days.
- **Space** — companion customization, cosmetics shop (incl. daily rotation), owned inventory.

### 4.3 Modals

- **Log** (`app/log.tsx`) — log a cigarette or a resisted craving (and context/trigger).
- **Craving** (`app/craving.tsx`) — panic-button toolkit: breathing guide, craving timer, distraction.
- **About** (`app/about.tsx`) — dedication, version, credits, "not medical advice" note.
- **Settings** (`app/settings.tsx`) — language, edit profile, notification preferences + quiet hours, situational mode, data export/reset.

---

## 5. Tracks

### 5.1 Cold Turkey

- User sets a quit date (now or scheduled). Live smoke-free timer from quit date.
- Structured daily content/missions, front-loaded for the first ~14 days (the critical window).
- Health timeline anchors from the quit date.
- Logging a cigarette = a slip: recorded honestly, does **not** reset to a brutal zero (keeps trend; companion stays supportive; optional "start a fresh stretch" framing without erasing history).

### 5.2 Gradual Reduction

- Engine builds a **daily allowance** curve from baseline → 0 over N days (see §6.2).
- Each day the user logs cigarettes; the engine compares actual vs allowance and adapts (see §6.3).
- "Win day" = at or under allowance (not only zero). Progress is framed around the downward trend.
- Health timeline shows benefits already accruing from cutting down + projected milestones from the eventual zero date.

---

## 6. The rule engine (`src/engine/`) — detailed spec

The engine is **pure TypeScript, no UI, no I/O, fully unit-tested.** UI and stores consume its outputs. All tunable constants live as named exports at the top of each module so they're easy to adjust.

### 6.1 Track assignment — `planEngine.ts`

Inputs: cigarettes/day `b`, dependence signal (e.g., minutes-to-first-cigarette proxy from onboarding, optional), readiness/confidence, user preference.

- Heuristic: low consumption + high readiness → suggest Cold Turkey; higher consumption or preference to taper → Gradual Reduction. Always allow user override.
- Output: `{ track, plan }`.

### 6.2 Reduction curve — `reduction.ts`

- Inputs: baseline `b`, duration `N` days (default derived from `b`, e.g., `N = clamp(b * DAYS_PER_CIG, MIN_DAYS, MAX_DAYS)`; defaults tunable, e.g., `DAYS_PER_CIG = 7`, `MIN_DAYS = 14`, `MAX_DAYS = 84`).
- Curve options (configurable, default = `linear`):
  - `linear`: `allowance(d) = round(b * (1 - d/N))`.
  - `easeOut`: gentler near the end, e.g., `round(b * (1 - (d/N)^EASE))`.
- Floors: never increase day-over-day; final days reach 0.
- Output: `number[]` of length `N` (daily allowances).

### 6.3 Adherence, trend & re-planning — `adherence.ts`

- **Primary metric = 7-day rolling average** of daily cigarettes. The streak/win-day counters are secondary and motivational only.
- `winDay(actual, allowance) = actual <= allowance`.
- **Re-plan rules:**
  - If rolling average > current allowance for `OVER_DAYS` consecutive days (default 3): the curve was too aggressive → **flatten/extend** it (recompute with a larger `N` and a realistic near-term allowance step). Never respond with punishment.
  - If rolling average is comfortably under allowance (margin ≥ `UNDER_MARGIN`): **offer** (don't force) to accelerate.
  - **Slip handling:** a spike never zeroes history; the trend line and rolling average absorb it. The companion responds with support, not disappointment.
- The design intent (important): a fragile all-or-nothing streak, once broken, triggers the "screw it, I already failed" relapse. Anchoring on the _trend_ prevents that. Encode this everywhere.

### 6.4 Vitality (companion mood/health) — `vitality.ts`

- `vitality: 0–100`, derived from recent behavior over a short window (default `VITALITY_WINDOW_HOURS = 60`).
- `vitality = clamp(BASE - penalty + bonus, 0, 100)`:
  - `penalty` scales with recent cigarettes above target / recent heavy smoking.
  - `bonus` scales with recent smoke-free stretches and under-target/win days.
- **Bands → companion states:** `0–25` exhausted/sad · `26–50` tired/low · `51–75` okay · `76–100` radiant. Drives the companion's expression, color, and glow (see §7.2).

### 6.5 Economy — `economy.ts` (see §7.3 for the formula)

### 6.6 Cosmetics — `cosmetics.ts` (see §7.4)

### 6.7 Health timeline — `health.ts`

- A dataset of standard, well-established recovery milestones, framed as **general information, not medical advice** (the app shows a brief disclaimer). Keep claims standard and non-alarmist.
- Milestones (anchor from quit/zero date; for reduction, also show "benefits already accruing"):
  - 20 min — heart rate and blood pressure start dropping toward normal.
  - 8–12 h — blood carbon-monoxide level drops, oxygen normalizes.
  - 24 h — risk of heart attack begins to decrease.
  - 48 h — nerve endings start regrowing; smell and taste improve.
  - 72 h — breathing eases; energy increases.
  - 2–12 weeks — circulation and lung function improve.
  - 1–9 months — coughing and shortness of breath decrease; cilia regrow.
  - 1 year — risk of coronary heart disease about half that of a smoker.
  - 5 years — stroke risk substantially reduced.
  - 10 years — lung-cancer death risk about half that of a smoker.
  - 15 years — coronary heart disease risk approaches that of a non-smoker.
- Personalization (profile) tunes which long-term stats to emphasize and the framing; it does not invent numbers.

### 6.8 Savings — `savings.ts`

- Inputs: after-tax `packPrice`, `cigsPerPack`, baseline `b`, actual logged consumption.
- `pricePerCig = packPrice / cigsPerPack`.
- `cigarettesAvoided = cumulative(expectedBaseline − actual)` (never negative per day).
- `saved = cigarettesAvoided * pricePerCig`.
- Powers the animated counter, the savings-over-time chart, and configurable "what you could buy instead" goal items.

### 6.9 Triggers → scheduling — `triggers.ts`

- Converts the user's trigger windows into a set of **local** notification schedules (a few minutes before each window) and exposes the situational-mode boost logic. See §9.

---

## 7. Companion, economy & cosmetics — detailed

### 7.1 The companion

- A small, characterful creature (default name "Wisp"). Customizable appearance + a personal **space/room** the user decorates with owned cosmetics.
- Implemented as **layered `react-native-svg` + `react-native-reanimated`** (guaranteed to run in Expo Go; see §14). The companion is composed of swappable SVG layers (body/face/accessories) whose colors, expression, and subtle idle animation are driven by props (`vitality`, `equippedCosmetics`, `mood`).
- Feedback is **haptic, not audio** (`expo-haptics`) — she plays muted. No sound in v1.

### 7.2 Health/mood reflection (drives the emotional loop)

- The companion's expression + palette + glow map to `vitality` bands (§6.4):
  - Low vitality (heavy recent smoking) → tired, droopy, muted colors, slower idle animation.
  - High vitality (smoke-free / under target) → radiant, bright, lively idle animation, gentle glow.
- This makes "her wellbeing" a felt consequence of behavior — the core Finch-like hook.

### 7.3 Coin economy — exponential reward for smoke-free time

The defining mechanic: **the longer the smoke-free stretch, the faster coins accrue (exponential, capped).**

- Coins accrue per smoke-free interval, with a rate that grows with the **consecutive smoke-free streak**:
  - `ratePerHour(h) = min(BASE_RATE * (1 + GROWTH)^floor(h / STEP_HOURS), MAX_RATE)`
  - Defaults (tunable in `economy.ts`): `BASE_RATE = 5`, `GROWTH = 0.15`, `STEP_HOURS = 24`, `MAX_RATE = BASE_RATE * 8`.
  - Effect: early hours ~5/hr; the rate steps up ~15% per day smoke-free, capped so it never runs away.
- **Reduction track** (still some smoking): the same duration-based accrual applies to the **gaps between cigarettes** within a day, so spacing cigarettes is directly rewarded. Plus the discrete bonuses below.
- **Discrete bonuses:** daily check-in, each _resisted_ logged craving, each win/under-target day, and milestone hits (configurable amounts).
- Coins are spent in the Space on cosmetics. Persist balance + ledger.

### 7.4 Cosmetics — incl. daily rotation

- Catalog of cosmetics (companion looks, room items, palettes), each with a coin price and unlock rule.
- **Daily-rotating set:** a subset of cosmetics whose available colors/designs change every day, chosen **deterministically from the date** (e.g., seed a PRNG with `YYYY-MM-DD`) so it's fully offline and identical on every device for that date. Gives a "something new each day" feel for free.
- Owned items persist in inventory; equipped items persist on the companion/space.

### 7.5 Daily rituals

- **Morning greeting** + **mood check-in** (companion responds warmly, awards a small bonus).
- **Evening reflection** (optional).
- **Hugs / encouragement** surfaced on hard days, after a resisted craving, or after a slip — always supportive, never disappointed.

---

## 8. Trackers

- **Money saved** (§6.8): animated counter, savings-over-time chart, configurable goal items ("what you could buy instead"). Editable brand/price/pack-size in settings.
- **Health timeline** (§6.7): personalized milestone list with progress, brief "not medical advice" note.
- **Progress**: trend chart (7-day rolling average of cigarettes), streak + win-days (secondary, motivational), and for reduction the allowance vs actual over time.

---

## 9. Triggers & notifications (all LOCAL)

- Only **local** notifications are used in v1 (scheduled on-device). No remote push, no server. This is the only kind this app needs and it works in Expo Go on iOS.
- **Trigger windows → schedules** (`triggers.ts` + `src/notifications/scheduler.ts`): a gentle notification a few minutes before each configured window (Tiffani's 15/15/30 breaks, commute time, etc.), deep-linking to the craving toolkit + a companion interaction offering a 2-minute alternative instead of the cigarette. The 30-min break can offer a slightly longer ritual; the 15-min ones a quick breathing exercise.
- **Situational "I'm out / drinking" mode:** a manual toggle that, for a few hours, raises support density (more frequent check-ins, one-tap craving access). Alcohol/social is a high-risk situational trigger.
- **Daily rituals:** morning greeting + optional evening reflection, gentle, never nagging.
- **Quiet hours:** user-configurable; suppress notifications overnight.
- Re-schedule on app launch and when settings change. Request notification permission with a clear in-context rationale (after onboarding, not on cold start).

---

## 10. Internationalization

- **`i18next` + `react-i18next` + `expo-localization`.** English default, Spanish available. Detect device locale; allow manual override in settings.
- **All user-facing strings live in `src/i18n/locales/en.json` and `es.json`.** No hard-coded strings in components.
- Keep the dedication and easter-egg texts in English (per design), sourced from `personal.config.ts` (not the locale files).

---

## 11. Personal touches (`src/personal/personal.config.ts`)

A **single file** the user edits for all personalization. Shape:

```ts
export const personal = {
  appName: 'Wisp',
  companionDefaultName: 'Wisp',
  dedicateeName: 'Tiffani',
  authorName: '<your name>', // EDIT
  dedicationLine: 'Made with ♥ for Tiffani',
  specialDate: 'MM-DD', // OPTIONAL anniversary — EDIT or leave null
  specialNumber: null as number | null, // OPTIONAL inside number for an easter egg — EDIT
  easterEggs: {
    companionLongPress:
      "Tiffani — I'm proud of you. Every hard day is worth it. — <your name>", // EDIT
    savingsOrStreakNote:
      "Look how far you've come. I knew you could. — <your name>", // EDIT
    hiddenSpaceNote: 'L ♥ T', // EDIT
    specialDateGreeting:
      "Happy day, Tiffani. Today, like every day, I'm in your corner.", // OPTIONAL
  },
};
```

### Dedication

- On the **About** screen: render `dedicationLine` tastefully (small, centered, with a heart). Professional apps have an About/credits screen; a dedication line reads as craft.

### Easter eggs (3 core + 1 optional, all English, all from `personal.config.ts`)

1. **Companion long-press:** long-press the companion 5× within ~3s → a soft heart-burst animation + `easterEggs.companionLongPress`.
2. **Savings/streak note:** when cumulative savings crosses `specialNumber` (or, if null, a sensible default milestone), show a one-time card with `easterEggs.savingsOrStreakNote`.
3. **Hidden space note:** a small tappable object in the Space (e.g., a tiny framed picture or a star) reveals `easterEggs.hiddenSpaceNote`.
4. **(Optional) special-date greeting:** if `specialDate` matches today, the companion greets with `easterEggs.specialDateGreeting`.

Keep them subtle and easy to disable/neutralize for a future public release (everything is config-driven, so a public build just swaps `personal.config.ts`).

---

## 12. Privacy & data

- All data on-device only. No account, no network calls for user data, no analytics/telemetry.
- **Settings → Export** (write the local data to a shareable JSON file) and **Reset** (wipe all data) must exist.
- App Store privacy label (when relevant): "Data Not Collected."

---

## 13. Monetization (scaffold only in v1)

- Model chosen for an eventual public release: **free with a single one-time unlock (~$4.99)** under Apple's Small Business Program. No subscription, no ads.
- **v1 implements only the architecture, not the purchase:** a single `isPremium` flag (in `useSettings`). In our builds it is forced `true`, so the whole app is unlocked and free for us. Real StoreKit IAP is wired only if/when publishing (Phase 8, optional). Apple supports promo codes / tester unlocks, so we never pay.
- Keep all "premium-able" features behind a thin `isPremium` check now, defaulting open, so gating later is a config change — not a refactor.

---

## 14. Tech stack (2026) & rationale

Cross-platform from one TypeScript codebase, developed entirely on Linux (Pop!\_OS), runnable on iPhone for free during development, with a clean path to TestFlight/App Store. **All libraries below are chosen to run in Expo Go** so the free dev path works on both iPhones; the few richer-but-native options are listed as optional dev-build upgrades only.

- **Expo (managed) + TypeScript (strict).** Develop on Linux; preview on a real iPhone via Expo Go.
- **Expo Router** — file-based routing.
- **NativeWind v4** — Tailwind for React Native (build-time transform, Expo Go compatible). Matches the author's Tailwind preference.
- **Zustand** (+ persistence via AsyncStorage) — app state/settings (lightweight, pure JS).
- **expo-sqlite** — structured/time-series data (logs, check-ins). Expo Go compatible.
- **@react-native-async-storage/async-storage** — small key-value (settings, flags, onboarding state).
- **expo-notifications** — local scheduled notifications (works in Expo Go on iOS).
- **react-native-svg** — the companion (layered) and custom charts. Expo Go compatible.
- **react-native-reanimated** + **react-native-gesture-handler** — animations and gestures (companion idle, transitions, chart animation, long-press easter egg). Expo Go compatible.
- **expo-haptics** — tactile feedback (replaces sound; she plays muted).
- **i18next + react-i18next + expo-localization** — EN/ES.
- **date-fns** — date math.
- **nanoid** — IDs.
- **Jest + @testing-library/react-native** — tests (engine has thorough unit tests).
- **ESLint + Prettier**, **TypeScript strict**, path aliases (`@/`).
- **EAS Build + EAS Submit** (cloud builds; no Mac needed) and **GitHub Actions** for CI (lint + typecheck + tests on PR).

**Charts:** build a small set of **custom animated chart components on `react-native-svg` + Reanimated** (full control over the "beautiful, animated, easy-to-read" look, zero native-dep risk in Expo Go). Avoid chart libraries that hard-depend on `react-native-linear-gradient`; use `expo-linear-gradient` if a gradient is needed.

**Optional dev-build-only upgrades (NOT v1, NOT required):** `@shopify/react-native-skia` or `lottie-react-native` for a richer animated companion. These need a development build (not Expo Go). The SVG+Reanimated companion is the v1 implementation; Skia/Lottie is a later visual upgrade once on a dev build.

**Why not an LLM/API or backend:** the personalized plan is simple math + heuristics; a rule engine is free, offline, private, deterministic, and testable. An API key cannot be safely shipped in a client app (it would require a backend proxy), which would break the on-device/no-backend design. So: no LLM at runtime in v1. (A future opt-in "coach chat" could add a tiny proxy — Phase-out item, §22.)

---

## 15. Folder structure

```
wisp/
├── app/                              # Expo Router screens
│   ├── _layout.tsx
│   ├── index.tsx                     # redirect: onboarding vs tabs
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   ├── consumption.tsx
│   │   ├── profile.tsx
│   │   ├── triggers.tsx
│   │   ├── readiness.tsx
│   │   └── plan-preview.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── plan.tsx
│   │   ├── progress.tsx
│   │   └── space.tsx
│   ├── craving.tsx                   # modal
│   ├── log.tsx                       # modal
│   ├── about.tsx
│   └── settings.tsx
├── src/
│   ├── engine/                       # pure, tested, no UI
│   │   ├── planEngine.ts
│   │   ├── reduction.ts
│   │   ├── adherence.ts
│   │   ├── vitality.ts
│   │   ├── economy.ts
│   │   ├── cosmetics.ts
│   │   ├── health.ts
│   │   ├── savings.ts
│   │   ├── triggers.ts
│   │   └── __tests__/
│   ├── data/
│   │   ├── db.ts                     # expo-sqlite init + migrations
│   │   ├── schema.ts
│   │   └── repositories/
│   │       ├── cigaretteLog.ts
│   │       ├── cravingLog.ts
│   │       ├── checkIn.ts
│   │       ├── planState.ts
│   │       └── inventory.ts
│   ├── store/
│   │   ├── useSettings.ts
│   │   ├── usePlan.ts
│   │   ├── useCompanion.ts
│   │   └── useEconomy.ts
│   ├── components/
│   │   ├── companion/                # Companion.tsx + layers + expressions
│   │   ├── charts/                   # LineChart.tsx, BarChart.tsx (svg + reanimated)
│   │   ├── craving/                  # BreathingGuide.tsx, CravingTimer.tsx, Distraction.tsx
│   │   └── ui/                       # Button, Card, Sheet, ProgressRing, Counter...
│   ├── theme/
│   │   └── tokens.ts                 # colors, spacing, typography, radii
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/{en,es}.json
│   ├── notifications/
│   │   └── scheduler.ts
│   ├── personal/
│   │   └── personal.config.ts        # EDIT ME (dedication + easter eggs)
│   ├── hooks/
│   ├── utils/
│   └── types/
├── assets/                           # svg, fonts, icons, splash
├── .github/workflows/ci.yml
├── app.config.ts
├── eas.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── tsconfig.json
├── eslint.config.js
├── .prettierrc
├── package.json
├── README.md
├── PROJECT.md                        # this file
└── PROGRESS.md                       # living status, updated each session
```

**Architecture rule:** the `engine/` is pure and has no imports from `data/`, `store/`, or React. Data flows: `data` (persistence) → `store` (state) → `engine` (computation, given plain inputs) → `components`/`app` (UI). Keep it that way.

---

## 16. Data model

**SQLite (expo-sqlite)** for time-series; **AsyncStorage/Zustand** for settings & app state.

SQLite tables (sketch — finalize in `schema.ts` with migrations):

- `cigarette_log(id, timestamp, trigger_category, note)`
- `craving_log(id, timestamp, resisted INTEGER, trigger_category, intensity, note)`
- `check_in(id, date, mood, note)`
- `plan_state(id, track, baseline, curve_type, n_days, start_date, target_date, current_allowance, replans_json)`
- `inventory(id, cosmetic_id, owned INTEGER, equipped INTEGER, acquired_at)`
- `economy_ledger(id, timestamp, delta, reason, balance_after)`

Settings/state (persisted via Zustand/AsyncStorage): profile (gender, age, years smoking, started date), pricing (packPrice, cigsPerPack, currency), notification prefs + quiet hours, language override, `isPremium`, companion name/equipped, onboarding completed.

Provide a small dev-seed utility (behind `__DEV__`) to populate sample logs for testing UI/charts.

---

## 17. Design direction & theme

- **Mood:** warm, cozy, calm, encouraging — Finch-adjacent but slightly more grown-up (adult user). Soft rounded shapes, generous whitespace, friendly-but-clean typography, gentle micro-animations.
- **Palette (starting point in `tokens.ts`, fully tunable):** calm sage/green primary, warm cream/off-white surfaces, soft warm accent (peach/amber), muted ink for text. Vitality glow uses the accent.
- **Dark mode** supported via tokens.
- **Motion:** subtle and kind (ease-out, no harsh bounces); companion has a slow idle animation that quickens with vitality.
- **Feedback:** haptics only (no sound in v1).
- **Accessibility:** dynamic type friendly, sufficient contrast, large tap targets, `accessibilityLabel`s on interactive elements, respect reduce-motion.

---

## 18. Engineering conventions

- **Conventional Commits** (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`…).
- **Feature branches + PRs**, one branch per phase (`feat/phaseN-<slug>`), squash-merge to `main`.
- **TypeScript strict**; no `any` without justification. Path alias `@/` → `src/`.
- **Tests:** the `engine/` is thoroughly unit-tested (track assignment, curve, re-plan, economy, vitality, savings, health). UI smoke tests where valuable.
- **Lint + typecheck + test must pass** before each commit (and in CI).
- Keep components small; keep business logic in `engine/`, not in components.
- Update `PROGRESS.md` at the end of every working session.

---

## 19. Build, run & deploy

### 19.1 Free dev path (no Mac, no Apple account) — use this first

- Develop on Pop!\_OS. Run `npx expo start`.
- **Preview options on Linux:** (1) **Expo web** in the browser for fast layout iteration; (2) **a real iPhone via the Expo Go app** (install Expo Go free, scan the QR) — this is the primary preview and works on **both** the iPhone 16 Pro Max and the iPhone 13 simultaneously. **Note: there is no iOS Simulator on Linux** (Simulator is macOS-only); the real device + web preview cover it.
- Local notifications, SQLite, charts, companion, haptics, i18n all work in Expo Go. This path is **$0** and good for the whole build + personal daily use.

### 19.2 Real-app path ($99/year, when ready) — TestFlight + App Store

- Enroll in the Apple Developer Program ($99/year) when you want the app as a standalone installable app and/or to publish.
- **EAS Build** compiles iOS in the cloud (no Mac). **EAS Submit** uploads to TestFlight/App Store.
- **TestFlight:** invite both Apple IDs; installs as a real app on both phones; builds last 90 days (re-upload via EAS is one command); free for testers; this is also the App Store staging ground.
- Configure `eas.json` (dev/preview/production profiles) and `app.config.ts` (bundle id, name from `personal.config.ts`, icons, splash). Min iOS target: **iOS 16** (TestFlight requirement; covers iPhone 13 and 16 Pro Max easily).

### 19.3 Compatibility

- Responsive layouts + safe-area handling so it looks right on iPhone 13 through 16 Pro Max (and any size in between). No device-specific assumptions.

---

## 20. Phased roadmap (token-safe: every phase ends runnable + committed)

Work **one phase at a time.** Each phase must end with: app boots and runs in Expo Go, `lint + typecheck + test` pass, a conventional-commit history on a `feat/phaseN-*` branch merged to `main`, and `PROGRESS.md` updated. This guarantees that if a session is cut short, the repo is always in a clean, runnable state and the next session resumes cleanly — without compromising the architecture defined above.

- **Phase 0 — Scaffold & foundations.** Expo + TS strict + Expo Router + NativeWind + theme tokens + i18n skeleton (en/es) + folder structure + ESLint/Prettier + path aliases + CI workflow + README (with portfolio narrative) + PROGRESS.md. _DoD:_ boots to a placeholder Home in Expo Go; lint/typecheck pass; committed.
- **Phase 1 — Data layer & models.** expo-sqlite schema + migrations + repositories + Zustand stores + types + dev-seed. Unit tests for repositories. _DoD:_ can log/read cigarette, craving, check-in; tests pass.
- **Phase 2 — Onboarding & plan engine.** Onboarding flow + `planEngine`/`reduction` (track assignment + curve) + Plan screen. Engine unit tests. _DoD:_ completing onboarding assigns a track and produces a plan; engine tests pass.
- **Phase 3 — Adherence, re-planning & savings.** `adherence` (rolling avg, win days, trend, re-plan), `savings`, basic progress. Tests. _DoD:_ logging updates trend + savings; re-plan triggers correctly and non-punitively.
- **Phase 4 — Companion, vitality & economy.** Companion SVG component + states, `vitality`, `economy` (exponential coins + bonuses), Space + cosmetics (incl. daily rotation) + inventory, haptics. _DoD:_ companion reflects vitality; coins accrue; buy/equip cosmetics.
- **Phase 5 — Craving toolkit & triggers/notifications.** Breathing guide, craving timer, distraction; trigger windows → local notification scheduling; situational mode; daily rituals; quiet hours. _DoD:_ panic button works; scheduled notifications fire; situational mode raises support.
- **Phase 6 — Charts & health timeline.** Custom animated SVG charts (cigarette trend, savings over time, allowance vs actual) + personalized health timeline. _DoD:_ Progress screen shows animated charts + timeline.
- **Phase 7 — i18n completion, personal touches & polish.** Full en/es strings, About + dedication, the 2–3 easter eggs via `personal.config.ts`, settings (language, profile edit, notifications, export/reset), accessibility, empty/edge states, visual polish, dark mode. _DoD:_ language switch works; dedication + easter eggs present; app feels finished.
- **Phase 8 — Release prep (only when ready, $99).** `eas.json` profiles, app icon + splash, EAS dev build, TestFlight submit, optional StoreKit `isPremium` wiring. _DoD:_ installable build on TestFlight on both phones.

---

## 21. how this gets built

1. Put this `PROJECT.md` at the repo root. Create an empty `PROGRESS.md`.
2. Each session, start with: **"Read PROJECT.md and PROGRESS.md. Continue with Phase N."** (Start at Phase 0.)
3. the agent should: create the phase branch, implement the phase, run `lint + typecheck + test`, commit in small conventional commits, open/merge the PR, then **update PROGRESS.md** with what's done and the exact next step.
4. Do **one phase per session.** Always leave the repo runnable and committed. Never start a phase without finishing/committing the previous one cleanly.
5. Do not change architecture decisions in this document silently — if something here turns out to be wrong or better, flag it in `PROGRESS.md` and note the change.
6. Because the real context lives in the repo + these two files, session/token limits never lose work: a fresh session re-reads them and resumes.

**`PROGRESS.md` format :**

```
# PROGRESS
## Current phase: <N> — <name>  (status: in-progress | done)
## Done
- <bullet> (commit <hash>)
## Next steps
- <the exact next action>
## Notes / deviations from PROJECT.md
- <if any>
```

---

## 22. Out of scope now / future ideas

- **Sound & voice** (she plays muted now) — optional later, off by default.
- **ML trigger insights (v2, on-device).** Once enough craving data exists, surface descriptive patterns ("cravings cluster around 5pm / bus stops / drinking"). Honestly, this is mostly descriptive statistics, not heavy ML; a small on-device "craving-risk" model is a possible portfolio flex but thin with one user's data. Rules win for v1.
- **LLM coach chat (opt-in, needs a tiny key-holding proxy).** Could power dynamic encouragement/Q&A; gated behind premium for a public release. Not v1 (would break on-device/no-backend).
- **Community/social** (peer support) — needs a backend; later.
- **Richer companion animation** via Skia/Lottie in a dev build.
- **Apple Watch / widgets.**
- **Android polish** (the same codebase already targets it).

---

_End of PROJECT.md._
