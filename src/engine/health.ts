/**
 * Recovery-milestone timeline (PROJECT.md §6 — health). Pure.
 *
 * A sequence of improvements that typically follow quitting, grouped into
 * phases (levels). General wellbeing info, NOT medical advice — the UI shows a
 * disclaimer. Copy (title/body/detail/fact) lives in i18n under
 * `health.milestones.<id>.*`; the citation `source` lives here as data (names +
 * years read the same in any language). Sources are a solid first pass —
 * primarily the U.S. Surgeon General's 1990 report "The Health Benefits of
 * Smoking Cessation", with CDC, American Cancer Society (ACS) and NHS.
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

const SGR = 'U.S. Surgeon General, 1990';
const ACS = 'American Cancer Society';
const NHS = 'NHS (UK)';
const CDC = 'CDC';

/** Phases (levels), each with ascending milestones. */
export const HEALTH_PHASES: HealthPhase[] = [
  {
    id: 'p1',
    milestones: [
      { id: 'pulse', atHours: 20 / 60, source: `${SGR}; ${ACS}` },
      { id: 'nicotine', atHours: 2 * HOUR, source: 'Benowitz, NEJM 2009' },
      { id: 'co_half', atHours: 8 * HOUR, source: NHS },
      { id: 'co_normal', atHours: 12 * HOUR, source: `${SGR}; ${CDC}` },
    ],
  },
  {
    id: 'p2',
    milestones: [
      { id: 'heart_24h', atHours: 1 * DAY, source: `${SGR}; AHA` },
      { id: 'senses', atHours: 2 * DAY, source: `${ACS}; ${NHS}` },
      { id: 'breathing', atHours: 3 * DAY, source: `${ACS}; ${NHS}` },
    ],
  },
  {
    id: 'p3',
    milestones: [
      { id: 'circulation', atHours: 2 * WEEK, source: SGR },
      { id: 'withdrawal', atHours: 4 * WEEK, source: 'Hughes, 2007' },
    ],
  },
  {
    id: 'p4',
    milestones: [
      { id: 'lungs', atHours: 1 * MONTH, source: ACS },
      { id: 'lung_function', atHours: 3 * MONTH, source: SGR },
      { id: 'cilia', atHours: 9 * MONTH, source: `${ACS}; ${SGR}` },
    ],
  },
  {
    id: 'p5',
    milestones: [
      { id: 'heart_1y', atHours: 1 * YEAR, source: `${SGR}; ${ACS}` },
      { id: 'stroke', atHours: 5 * YEAR, source: `${SGR}; ${CDC}` },
      { id: 'lung_cancer', atHours: 10 * YEAR, source: `${SGR}; ${ACS}` },
      { id: 'chd', atHours: 15 * YEAR, source: SGR },
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
