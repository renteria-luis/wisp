/**
 * Recovery-milestone timeline (PROJECT.md §6 — health). Pure.
 *
 * A well-known sequence of improvements that typically follow quitting, anchored
 * to the journey start. This is general wellbeing information, NOT medical
 * advice — the UI surfaces that disclaimer. Copy for each milestone lives in
 * i18n under `health.milestones.<id>.{title,body}`; here we keep only timing.
 */

export interface HealthMilestone {
  id: string;
  /** Hours after the journey start when this point is typically reached. */
  atHours: number;
}

const HOUR = 1;
const DAY = 24 * HOUR;
const YEAR = 365 * DAY;

/** Ordered ascending — from the first 20 minutes out to ten years. */
export const HEALTH_MILESTONES: HealthMilestone[] = [
  { id: 'pulse', atHours: 20 / 60 },
  { id: 'co', atHours: 12 * HOUR },
  { id: 'nicotine', atHours: 1 * DAY },
  { id: 'senses', atHours: 2 * DAY },
  { id: 'breathing', atHours: 3 * DAY },
  { id: 'circulation', atHours: 14 * DAY },
  { id: 'lungs', atHours: 30 * DAY },
  { id: 'lungFunction', atHours: 90 * DAY },
  { id: 'heart', atHours: 1 * YEAR },
  { id: 'lungCancer', atHours: 10 * YEAR },
];

export interface MilestoneProgress {
  milestone: HealthMilestone;
  reached: boolean;
  /** 0..1 fill toward this milestone measured from the previous one. */
  progress: number;
}

function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * Each milestone tagged with whether it's reached and how far along the segment
 * leading to it has filled (1 once reached). The first not-yet-reached entry is
 * the "current" one and the only partial fill.
 */
export function milestoneTimeline(elapsedHours: number): MilestoneProgress[] {
  const elapsed = Math.max(0, elapsedHours);
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

/** How many milestones have been reached by `elapsedHours`. */
export function reachedCount(elapsedHours: number): number {
  const elapsed = Math.max(0, elapsedHours);
  return HEALTH_MILESTONES.reduce(
    (n, m) => (elapsed >= m.atHours ? n + 1 : n),
    0,
  );
}

/** The next milestone still ahead (with its partial progress), or null if all reached. */
export function nextMilestone(elapsedHours: number): MilestoneProgress | null {
  return milestoneTimeline(elapsedHours).find((m) => !m.reached) ?? null;
}
