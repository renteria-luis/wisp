/**
 * Core domain types shared across the engine, stores, and UI.
 * Pure types only — no runtime, no imports.
 */

export type Track = 'cold_turkey' | 'gradual_reduction';

export type CurveType = 'linear' | 'easeOut';

export type TrackPreference = 'quit' | 'reduce' | 'unsure';

export type Gender = 'female' | 'male' | 'nonbinary' | 'prefer_not';

export type TriggerCategory =
  | 'work_break'
  | 'commute'
  | 'alcohol_social'
  | 'after_meals'
  | 'stress'
  | 'boredom'
  | 'coffee'
  | 'anger'
  | 'sadness'
  | 'waiting'
  | 'reward';

/** Signals collected during onboarding that drive track assignment (§6.1). */
export interface ReadinessInputs {
  /** Baseline cigarettes per day. */
  cigarettesPerDay: number;
  /** Self-reported readiness/confidence, 0–10. */
  readiness: number;
  /** Optional dependence proxy: minutes from waking to first cigarette. */
  minutesToFirstCigarette?: number;
  /** Explicit preference for quitting outright vs cutting down. */
  preference: TrackPreference;
}

/** Result of the track-assignment heuristic (before any user override). */
export interface TrackSuggestion {
  track: Track;
  /** Signed score (>0 → cold turkey, ≤0 → gradual). Exposed for transparency. */
  score: number;
  /** i18n key explaining the suggestion. */
  rationaleKey: string;
}

/** A concrete, computed plan (mirrors the `plan_state` row in §16). */
export interface Plan {
  track: Track;
  /** Baseline cigarettes/day the plan was built from. */
  baseline: number;
  curveType: CurveType;
  /** Number of days the plan spans (reduction length, or cold-turkey window). */
  nDays: number;
  /** ISO `yyyy-MM-dd` the plan starts (day 0). */
  startDate: string;
  /** ISO `yyyy-MM-dd` allowance reaches 0 (reduction) or quit date (cold turkey). */
  targetDate: string;
  /** Per-day allowance, length `nDays`. Cold turkey is all zeros. */
  allowances: number[];
}

export interface Profile {
  gender?: Gender;
  age?: number;
  yearsSmoking?: number;
  /** ISO `yyyy-MM-dd` the user started smoking. */
  startedSmokingDate?: string;
}

export interface Pricing {
  /** After-tax price of a pack. */
  packPrice: number;
  cigsPerPack: number;
  /** ISO 4217 currency code, e.g. "USD". */
  currency: string;
}

/** Companion mood bands derived from the vitality score (§6.4). */
export type VitalityState = 'exhausted' | 'tired' | 'okay' | 'radiant';

export type CosmeticType =
  | 'companion_color'
  | 'accessory'
  | 'room'
  | 'palette'
  | 'character';

/** A purchasable cosmetic (§7.4). `name`/`swatch` drive display. */
export interface Cosmetic {
  id: string;
  type: CosmeticType;
  price: number;
  /** Hex color used as the item's swatch / applied tint where relevant. */
  swatch: string;
}

/** Local 24-hour time of day. */
export interface TimeOfDay {
  hour: number;
  minute: number;
}

/** Overnight-aware quiet-hours window (notifications suppressed inside). */
export interface QuietHours {
  start: TimeOfDay;
  end: TimeOfDay;
}
