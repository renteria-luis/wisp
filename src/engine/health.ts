/**
 * Recovery-milestone timeline (PROJECT.md §6 — health). Pure.
 *
 * ~30 improvements that typically follow quitting, grouped into named phases.
 * General wellbeing info, NOT medical advice — the UI shows a disclaimer. Copy
 * (title/body/when/detail/fact) lives in i18n under `health.milestones.<id>.*`
 * and phase names under `health.phases.<id>.*`; the citation `source` lives here
 * as data (names/years read the same in any language).
 *
 * Sources, primarily: U.S. Surgeon General reports (1990 "The Health Benefits of
 * Smoking Cessation"; 2020 "Smoking Cessation"), CDC, American Cancer Society
 * (ACS), NHS, WHO. Early pharmacokinetics: Benowitz, NEJM 2010. Withdrawal time
 * course: Hughes 2007. Dopamine normalization at ~3 months: Vernaleken et al.,
 * Biological Psychiatry 2016. A few wellbeing points are marked as estimates.
 */

const HOUR = 1;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export interface HealthMilestone {
  id: string;
  /** Hours of recovery progress at which this point is typically reached. */
  atHours: number;
  /** Citation shown in the detail view (not translated). */
  source: string;
}

export interface HealthPhase {
  id: string;
  milestones: HealthMilestone[];
}

const SGR = 'U.S. Surgeon General';
const ACS = 'American Cancer Society';
const NHS = 'NHS (UK)';
const CDC = 'CDC';
const WHO = 'WHO';
const BENOWITZ = 'Benowitz, NEJM 2010';
const HUGHES = 'Hughes, 2007';
const ESTIMATE = 'General wellbeing estimate';

/** Phases (levels), each with ascending milestones. */
export const HEALTH_PHASES: HealthPhase[] = [
  {
    id: 'p1',
    milestones: [
      { id: 'm_20min', atHours: 20 / 60, source: `${SGR}; ${CDC}` },
      { id: 'm_30min', atHours: 0.5, source: ESTIMATE },
      { id: 'm_1h', atHours: 1, source: BENOWITZ },
      { id: 'm_2h', atHours: 2, source: BENOWITZ },
      { id: 'm_6h', atHours: 6, source: BENOWITZ },
      { id: 'm_8h', atHours: 8, source: NHS },
      { id: 'm_12h', atHours: 12, source: `${SGR}; ${CDC}` },
    ],
  },
  {
    id: 'p2',
    milestones: [
      { id: 'm_24h', atHours: 1 * DAY, source: `${SGR}; AHA` },
      { id: 'm_36h', atHours: 1.5 * DAY, source: ESTIMATE },
      { id: 'm_48h', atHours: 2 * DAY, source: `${ACS}; ${NHS}` },
      { id: 'm_72h', atHours: 3 * DAY, source: `${ACS}; ${NHS}` },
    ],
  },
  {
    id: 'p3',
    milestones: [
      { id: 'm_1week', atHours: 1 * WEEK, source: HUGHES },
      { id: 'm_10day', atHours: 10 * DAY, source: HUGHES },
      { id: 'm_2week', atHours: 2 * WEEK, source: SGR },
      { id: 'm_3week', atHours: 3 * WEEK, source: SGR },
      { id: 'm_1month', atHours: 1 * MONTH, source: HUGHES },
      { id: 'm_6week', atHours: 6 * WEEK, source: 'Oral-health research' },
    ],
  },
  {
    id: 'p4',
    milestones: [
      { id: 'm_2month', atHours: 2 * MONTH, source: ESTIMATE },
      {
        id: 'm_3month',
        atHours: 3 * MONTH,
        source: `${SGR}; Vernaleken et al., Biol. Psychiatry 2016`,
      },
      { id: 'm_4month', atHours: 4 * MONTH, source: SGR },
      { id: 'm_5month', atHours: 5 * MONTH, source: ESTIMATE },
      { id: 'm_6month', atHours: 6 * MONTH, source: ACS },
      { id: 'm_9month', atHours: 9 * MONTH, source: `${ACS}; ${SGR}` },
    ],
  },
  {
    id: 'p5',
    milestones: [
      { id: 'm_1year', atHours: 1 * YEAR, source: `${SGR}; ${ACS}` },
      { id: 'm_18month', atHours: 18 * MONTH, source: ESTIMATE },
      { id: 'm_2year', atHours: 2 * YEAR, source: ESTIMATE },
    ],
  },
  {
    id: 'p6',
    milestones: [
      { id: 'm_5year', atHours: 5 * YEAR, source: `${SGR}; ${CDC}; ${WHO}` },
      { id: 'm_10year', atHours: 10 * YEAR, source: `${SGR}; ${ACS}` },
      { id: 'm_15year', atHours: 15 * YEAR, source: SGR },
      { id: 'm_20year', atHours: 20 * YEAR, source: `${SGR} 2020; ${WHO}` },
    ],
  },
];

/** Flat, ascending list of every milestone. */
export const HEALTH_MILESTONES: HealthMilestone[] = HEALTH_PHASES.flatMap(
  (p) => p.milestones,
);

export interface MilestoneProgress {
  milestone: HealthMilestone;
  reached: boolean;
  /** 0..1 fill toward this milestone measured from the previous one. */
  progress: number;
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/** Each milestone tagged reached + segment fill, given recovery hours. */
export function milestoneTimeline(recoveryHours: number): MilestoneProgress[] {
  const elapsed = Math.max(0, recoveryHours);
  let prevAt = 0;
  return HEALTH_MILESTONES.map((milestone) => {
    const reached = elapsed >= milestone.atHours;
    const span = milestone.atHours - prevAt;
    const progress = reached
      ? 1
      : span <= 0
        ? 0
        : clamp01((elapsed - prevAt) / span);
    prevAt = milestone.atHours;
    return { milestone, reached, progress };
  });
}

export function reachedCount(recoveryHours: number): number {
  const elapsed = Math.max(0, recoveryHours);
  return HEALTH_MILESTONES.reduce(
    (n, m) => (elapsed >= m.atHours ? n + 1 : n),
    0,
  );
}

/** The next milestone still ahead (with its partial progress), or null if all reached. */
export function nextMilestone(recoveryHours: number): MilestoneProgress | null {
  return milestoneTimeline(recoveryHours).find((m) => !m.reached) ?? null;
}

/** The phase that contains the next un-reached milestone (the "current" phase). */
export function currentPhaseId(recoveryHours: number): string {
  const elapsed = Math.max(0, recoveryHours);
  for (const phase of HEALTH_PHASES) {
    if (phase.milestones.some((m) => elapsed < m.atHours)) return phase.id;
  }
  return HEALTH_PHASES[HEALTH_PHASES.length - 1]!.id;
}

// ── Slip penalty (PROJECT.md §6.3, kept non-punitive) ─────────────────────────
// A cigarette never zeroes recovery; it nudges it back. Each cigarette in a day
// hits a little harder than the last, and any cigarette above that day's
// allowance hurts more. These are designed, tunable game constants — informed
// by harm-reduction (more/over-quota smoking = bigger setback), NOT a clinical
// formula. The smoke-free *timer* still resets to zero on every cigarette.
export const SETBACK_BASE_HOURS = 6;
export const SETBACK_GROWTH = 0.15;
export const OVER_QUOTA_MULTIPLIER = 2;

/** Recovery-hours lost for `count` cigarettes on a day with `allowance`. */
export function daySetbackHours(count: number, allowance: number): number {
  let total = 0;
  const limit = Math.max(0, allowance);
  for (let i = 0; i < count; i++) {
    const escalating = 1 + SETBACK_GROWTH * i;
    const overQuota = i >= limit;
    total += SETBACK_BASE_HOURS * escalating * (overQuota ? OVER_QUOTA_MULTIPLIER : 1);
  }
  return total;
}

/** Total recovery-hours lost across a daily series (aligned with allowances). */
export function totalSetbackHours(
  actualDaily: number[],
  allowances: number[],
): number {
  return actualDaily.reduce(
    (sum, count, i) => sum + daySetbackHours(count, allowances[i] ?? 0),
    0,
  );
}
